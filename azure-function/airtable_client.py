import os
import pprint
import time
import dotenv
import logging
import requests
import pyairtable
from typing import Dict, Any, List
from pyairtable import utils
from datetime import datetime
from collections import Counter
from urllib.parse import urlparse
from constants import SearchField
import helper_functions as helpers
from pyairtable.formulas import match
from google_maps_client import GoogleMapsClient
from concurrent.futures import ThreadPoolExecutor, as_completed


class AirtableClient:
    """Defines methods for interaction with the Charlotte Third Places Airtable database.
    """

    def __init__(self):
        logging.basicConfig(level=logging.INFO)

        if 'FUNCTIONS_WORKER_RUNTIME' in os.environ:
            logging.info('Airtable Client instantiated for Azure Function use.')
        else:
            logging.info('Airtable Client instantiated for local use.')
            dotenv.load_dotenv()

        self.AIRTABLE_BASE_ID = os.environ['AIRTABLE_BASE_ID']
        self.AIRTABLE_PERSONAL_ACCESS_TOKEN = os.environ['AIRTABLE_PERSONAL_ACCESS_TOKEN']
        self.charlotte_third_places = pyairtable.Table(
            self.AIRTABLE_PERSONAL_ACCESS_TOKEN, self.AIRTABLE_BASE_ID, 'Charlotte Third Places'
        )
        self.google_maps_client = GoogleMapsClient()
        self.all_third_places = self.charlotte_third_places.all(sort=["Place"])

    def update_place_record(self, record_id: str, field_to_update: str, update_value, overwrite: bool) -> Dict[str, Any]:
        """
        Attempts to update a record in the Airtable database based on given parameters. 
        The function considers whether the field should be overwritten if it already exists.

        Args:
            record_id (str): The unique identifier for the record.
            field_to_update (str): The field within the record to update.
            update_value: The new value for the specified field.
            overwrite (bool): Whether to overwrite the existing value if the field is not empty.

        Returns:
            bool: True if an update occurred, False otherwise.
        """
        try:
            record = self.charlotte_third_places.get(record_id)
            place_name = record['fields']['Place']
            current_value = record['fields'].get(field_to_update)

            current_value_normalized = helpers.normalize_text(current_value)
            update_value_normalized = helpers.normalize_text(update_value)

            result = {
                "updated": False,
                "field_name": field_to_update,
                "record_id": record_id,
                "old_value": current_value,
                "new_value": update_value
            }

            # 1. First, check if the new value to update (`update_value_normalized`) is meaningful.
            #    - If `update_value_normalized` is `None` or an empty string, there's no point in proceeding,
            #      since we don't want to update with 'useless' values. So, we skip the update in such cases.
            # 2. Then, if the `update_value_normalized` is valid (not `None` or an empty string), we proceed to check the following conditions:
            #    a) Update if the current value (`current_value_normalized`) is either `None` or 'Unsure'.
            #       - This ensures we update fields that either don't have any value or have uncertain values.
            #    b) If the `current_value_normalized` is neither `None` nor 'Unsure', we check if the `overwrite` flag is set:
            #       - If `overwrite` is `True`, we allow updating even when the current value is already present.
            #       - However, we still verify that the `update_value_normalized` is different from `current_value_normalized`,
            #         to avoid making redundant updates where the value already matches.
            if (
                update_value_normalized not in (None, '') and  # Skip if update value is None or empty string
                (
                    current_value_normalized in (None, 'Unsure') or  # Update if current value is None or 'Unsure'
                    (
                        overwrite and  # Respect the overwrite flag
                        current_value_normalized != update_value_normalized  # Ensure the update value is different
                    )
                )
            ):
                self.charlotte_third_places.update(record_id, {field_to_update: update_value})
                logging.info(
                    f'Successfully updated the field "{field_to_update}" for place "{place_name}". New value: "{update_value}".'
                )
                time.sleep(1)
                result["updated"] = True
            else:
                logging.info(
                    f'\n\nSkipped updating the field "{field_to_update}" for place "{place_name}".\n'
                    f'Existing value:{current_value}\n'
                    f'Provided value:{update_value}\n'
                )
            return result
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            return {
                "updated": False,
                "field_name": field_to_update,
                "record_id": record_id,
                "old_value": None,
                "new_value": None
            }

    def get_base_url(self, url: str) -> str:
        """
        Extracts and returns the base URL (scheme, domain, and path) from a full URL.
        If the input URL is invalid, returns an empty string.

        Args:
            url (str): The full URL from which to extract the base.

        Returns:
            str: The base URL, or an empty string if the URL is invalid.
        """
        parsed_url = urlparse(url)

        # Ensure scheme and netloc are not empty (they're essential for a valid URL)
        if not parsed_url.scheme or not parsed_url.netloc:
            return ""

        # Return the base URL with the path (optional)
        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}".strip()

    def get_parking_status(self, place_details_response):
        """
        Determines the parking status of a place based on available parking options.

        Args:
            place_details_response (dict): The dictionary containing details about the place, including parking options.

        Returns:
            str: "Free" if any free parking options are available,
                 "Paid" if only paid or valet parking options are available,
                 "Unsure" if no parking information is available or if the options don't fit into the above categories.

        Reference: https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#parkingoptions
        """
        parking_options = place_details_response.get('parkingOptions', {})

        # Check for free parking availability
        free_parking_keys = ["freeParkingLot",
                             "freeStreetParking", "freeGarageParking"]
        if any(parking_options.get(key, False) for key in free_parking_keys):
            return "Free"

        # Check for paid parking availability
        paid_parking_keys = [
            "paidParkingLot", "paidStreetParking", "paidGarageParking", "valetParking"]
        if any(parking_options.get(key, False) for key in paid_parking_keys):
            return "Paid"

        return "Unsure"

    def determine_purchase_requirement(self, place_details_response):
        """
        Determines if a purchase is required based on the price level of a place.

        Args:
            place_details_response (dict): Response from Google Maps API containing the price level information.

        Returns:
            str: "Yes" if purchase is required, "No" if not, and "Unsure" if the status cannot be determined.
        """
        # Define a mapping of price levels to purchase requirements. The right hand values are the answer to the question
        # "Does this place require a purchase to hangout?"
        price_level_mapping = {
            'PRICE_LEVEL_UNSPECIFIED': 'Unsure',
            'PRICE_LEVEL_FREE': 'No',
            'PRICE_LEVEL_INEXPENSIVE': 'Yes',
            'PRICE_LEVEL_MODERATE': 'Yes',
            'PRICE_LEVEL_EXPENSIVE': 'Yes',
            'PRICE_LEVEL_VERY_EXPENSIVE': 'Yes'
        }

        # Get the price level from the response, defaulting to 'PRICE_LEVEL_UNSPECIFIED' if not found
        price_level = place_details_response.get(
            'priceLevel', 'PRICE_LEVEL_UNSPECIFIED')

        # Return the corresponding purchase requirement, default to 'Unsure' if the price level is not in the mapping
        return price_level_mapping.get(price_level, 'Unsure')

    def enrich_base_data(self) -> list:
        """
        Enriches the base data of places stored in Airtable with additional metadata fetched from Google Maps.
        Uses threading to parallelize fetching details from Google Maps for all places.
        """
        places_updated = []

        def process_place(third_place: dict) -> dict:
            """
            Processes a single place to fetch metadata from Google Maps and update the place record in Airtable.

            Args:
                third_place (dict): The place data from Airtable.

            Returns:
                dict: Contains:
                    - "place_name": The name of the place.
                    - "place_id": The Google Maps Place ID.
                    - "record_id": The Airtable record ID.
                    - "field_updates": Dictionary of field update statuses.
                    - "message": Error message, if any.
            """
            return_data = {
                "place_name": "",
                "place_id": "",
                "record_id": "",
                "field_updates": {},
                "message": ""
            }

            try:
                place_name = third_place['fields']['Place']
                return_data['place_name'] = place_name

                record_id = third_place['id']
                return_data['record_id'] = record_id

                place_id = third_place['fields'].get('Google Maps Place Id', None)
                place_id = self.google_maps_client.place_id_handler(place_name, place_id)
                return_data['place_id'] = place_id

                if place_id:
                    place_details_response = self.google_maps_client.place_details_new(
                        place_id, [
                            'googleMapsUri', 'websiteUri', 'formattedAddress', 'editorialSummary',
                            'addressComponents', 'parkingOptions', 'priceLevel', 'paymentOptions',
                            'primaryType', 'outdoorSeating', 'location', 'photos'
                        ])

                    if place_details_response:
                        website = self.get_base_url(place_details_response.get('websiteUri'))
                        address_components = place_details_response.get('addressComponents', [])
                        neighborhood = next((
                            component.get('longText', '').title()
                            for component in address_components if 'neighborhood' in component.get('types', [])
                        ), ''
                        )

                        location = place_details_response.get('location')
                        parking_situation = self.get_parking_status(place_details_response)
                        purchase_required = self.determine_purchase_requirement(place_details_response)

                        photos_list = self.get_place_photos(place_details_response.get('photos', []))
                        if not photos_list:
                            logging.warning(f'No photos found for {place_name}.')

                        # "Field Name": (field_value, overwrite_field_in_airtable=True/False)
                        field_updates = {
                            'Google Maps Place Id': (place_id, True),
                            'Google Maps Profile URL': (place_details_response.get('googleMapsUri'), True),
                            'Neighborhood': (neighborhood, False),
                            'Website': (website, True),
                            'Address': (place_details_response.get('formattedAddress'), True),
                            'Description': (place_details_response.get('editorialSummary', {}).get('text', ''), False),
                            'Purchase Required': (purchase_required, False),
                            'Parking Situation': (parking_situation, False),
                            'Latitude': (str(location['latitude']), True),
                            'Longitude': (str(location['longitude']), True),
                            'Photos': (str(photos_list), True)
                        }

                        for field_name, (field_value, overwrite) in field_updates.items():
                            update_result = self.update_place_record(
                                record_id,
                                field_name,
                                field_value,
                                overwrite
                            )

                            return_data['field_updates'][field_name] = {
                                "updated": update_result["updated"],
                                "old_value": update_result["old_value"],
                                "new_value": update_result["new_value"]
                            }

                        return return_data
                    else:
                        logging.warning(f'Failed to fetch place details for {place_name}.')
                        return_data["message"] = "Failed to fetch place details from Google Maps."
                else:
                    logging.warning(f'No place ID found for {place_name}.')
                    return_data["message"] = "No valid place ID found."

            except Exception as e:
                logging.error(f"Error processing place {place_name}: {e}")
                return_data["message"] = f"Error: {str(e)}"

            return return_data

        # Run the enrichment process in parallel for all places
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(process_place, third_place): third_place['fields']['Place']
                for third_place in self.all_third_places
            }

            for future in as_completed(futures):
                place_name = futures[future]  # Get the place_name associated with the future
                try:
                    result = future.result()
                    places_updated.append(result)
                    logging.info(f"Finished processing {place_name}")
                except Exception as e:
                    logging.error(f"Error processing {place_name}: {e}")

        # Return the list of places with update results and messages
        return places_updated

    def get_record(self, search_field: SearchField, search_value: str) -> dict:
        logging.info(
            f"Getting record using search field {search_field.value} and search value {search_value}")
        match_formula = match({search_field.value: search_value})

        try:
            matched_record = self.charlotte_third_places.all(
                formula=match_formula)
            if matched_record and len(matched_record) == 1:
                logging.info(
                    f"Match found. Record Id is {matched_record[0]['id']}.")
                return matched_record[0]
            else:
                logging.warning(
                    f"No match found for {search_field.value} with value {search_value} or more than one result was found.")
                return None
        except Exception as e:
            logging.error(
                f"An error occurred while retrieving records: {str(e)}")
            return None

    def get_place_photos(self, place_details_photos: list) -> list:
        """
        Retrieves and saves photos for a place using the Google Maps Place Photos API."""
        place_photos_list = []

        for photo in place_details_photos:
            photo_name = photo['name']
            place_photos_response = self.google_maps_client.place_photo_new(photo_name, '4800', '4800')

            if place_photos_response:
                place_photos_list.append(place_photos_response['photoUri'])

        return place_photos_list

    def save_photo_locally(self, photo_name, photo_url):
        """
        Helper function to save a photo locally in the specified directory.
        """
        os.makedirs('./data/photos', exist_ok=True)
        with open(f'./data/photos/{photo_name}', 'wb') as photo_handler:
            photo_data = requests.get(photo_url).content
            photo_handler.write(photo_data)
            logging.info(f'Just saved a photo for {photo_name}.')

    def find_duplicate_records(self, field_name: str, third_place_records: list) -> dict:
        """
        Identifies and returns a dictionary of values that appear more than once for a specified field
        across a list of records.

        Args:
            field_name (str): The name of the field to check for duplicate values.
            third_place_records (list): A list of records (dictionaries) from the Airtable database.

        Returns:
            dict: A dictionary with each key being a value that appears more than once in the specified field,
                and each value being the count of occurrences.
        """
        # Extract values from specified field across all records that contain the field
        field_values = [
            record['fields'].get(field_name) for record in third_place_records
            if field_name in record['fields']
        ]

        # Count occurrences of each value
        field_values_count = Counter(field_values)

        # Filter counts to retain only those values that occur more than once
        multiple_occurrences = {value: count for value,
                                count in field_values_count.items() if count > 1}

        return multiple_occurrences

    def get_places_missing_field(self, field_to_check, third_place_records):
        """For a collection of third places returned by calling pyAirtable.Table.all(), return a list of places that are missing a value in the provided field_to_check.
        """
        missing_places = []
        for third_place in third_place_records:
            if field_to_check not in third_place['fields']:
                place_name = third_place['fields']['Place']
                missing_places.append(place_name)

        return missing_places

    def print_report_section(self, file, collection, section_title):
        """Given a file and a collection (list or dict), pretty print to the file using the section_title as the heading.
        """
        file.write(f'{section_title}\n\n')
        file.write(pprint.pformat(collection))
        file.write('\n\n')

    def data_quality_checks(self):
        """Method for going through records in the Airtable database and highlighting any that seem odd. Some of these cases are valid states, which is why I'm not automatically taking action on them. The goal is to have an easy way to find the outliers, and update them manually if need be.

        TBD - Does this really need to be a function? Surely you can use Airtable to generate this report through a view or some other feature.
        """
        third_place_records = self.all_third_places

        dupe_scan_fields = ['Website', 'Address',
                            'Google Maps Profile', 'Google Maps Place Id']

        missing_scan_fields = ['Size', 'Website', 'Address', 'Description',
                               'Ambience', 'Neighborhood', 'Google Maps Profile', 'Google Maps Place Id']

        with open('./data/data-quality-report.txt', 'w') as report_file:
            for field_to_scan in dupe_scan_fields:
                scan_result = self.find_duplicate_records(
                    field_to_scan, third_place_records)
                self.print_report_section(
                    report_file, scan_result, f'Recurring Report: {field_to_scan}')

            for field_to_scan in missing_scan_fields:
                scan_result = self.get_places_missing_field(
                    field_to_scan, third_place_records)
                self.print_report_section(
                    report_file, scan_result, f'Missing Records Report: {field_to_scan}')

    def has_reviews(self, place_id: str) -> bool:
        """Checks if the place with the given Google Maps Place ID has stored Google Maps reviews.

        Args:
            place_id (str): The Google Maps Place ID of the place to check.

        Returns:
            bool: True if the place has reviews ('Has Reviews' field is 'Yes'), False otherwise.
        """
        logging.info(f"Checking if place with Google Maps Place ID {place_id} has reviews.")
        record = self.get_record(SearchField.GOOGLE_MAPS_PLACE_ID, place_id)
        if record:
            has_reviews = record['fields'].get('Has Reviews', 'No')
            logging.info(f"Has Reviews for Place ID {place_id}: {has_reviews}")
            return has_reviews == 'Yes'
        else:
            logging.warning(f"Record with Place ID {place_id} not found.")
            return False

    def places_without_reviews(self) -> List[Dict[str, Any]]:
        """Retrieves all places that have no stored Google Maps reviews.

        Returns:
            List[Dict[str, Any]]: A list of records where 'Has Reviews' field is 'No'.
        """
        logging.info("Fetching places without reviews.")
        formula = match({'Has Reviews': 'No'})
        records = self.charlotte_third_places.all(formula=formula)
        logging.info(f"Found {len(records)} places without reviews.")
        return records

    def get_place_types(self) -> List[str]:
        """Retrieves a list of all distinct types from the 'Type' column in the Airtable base.

        Returns:
            List[str]: A sorted list of unique place types.
        """
        logging.info("Collecting all distinct place types from 'Type' column.")
        place_types = set()
        for record in self.all_third_places:
            type_field = record['fields'].get('Type', None)
            if type_field:
                if isinstance(type_field, list):
                    place_types.update(type_field)
                else:
                    place_types.add(type_field)
        logging.info(f"Found {len(place_types)} distinct place types.")
        return sorted(place_types)

    def refresh_operational_statuses(self) -> List[Dict[str, Any]]:
        """
        Refreshes the 'Operational' status of each place in the Airtable base by checking their current status via the Google Maps API.

        For each record in the 'Charlotte Third Places' Airtable base, this method performs the following:
        - Retrieves the Google Maps Place ID.
        - Uses the Google Maps API to determine if the place is operational.
        - Updates the 'Operational' field in Airtable with 'Yes' if the place is operational, 'No' otherwise.
        - Compares the new operational status with the current value in the 'Operational' field.
            - If they are the same, the update is skipped to conserve API calls.
            - If they are different, the record is updated accordingly.
        - Collects detailed information about each operation, including whether it was updated, skipped, or failed.

        Returns:
            List[Dict[str, Any]]: A list of dictionaries, each containing:
                - 'place_name': The name of the place.
                - 'place_id': The Google Maps Place ID.
                - 'record_id': The Airtable record ID.
                - 'old_value': The old value of the 'Operational' field.
                - 'new_value': The new value of the 'Operational' field.
                - 'update_status': A string indicating the operation status ('updated', 'skipped', 'failed').
                - 'message': Any additional messages or error descriptions.
        """
        results = []

        def process_place(third_place: dict) -> Dict[str, Any]:
            result = {
                'place_name': '',
                'place_id': '',
                'record_id': '',
                'old_value': '',
                'new_value': '',
                'update_status': '',
                'message': ''
            }
            try:
                place_name = third_place['fields'].get('Place', '')
                result['place_name'] = place_name

                record_id = third_place.get('id', '')
                result['record_id'] = record_id

                place_id = third_place['fields'].get('Google Maps Place Id')
                result['place_id'] = place_id

                if not place_id:
                    logging.warning(f"No Google Maps Place ID for {place_name}.")
                    result['update_status'] = 'failed'
                    result['message'] = 'No Google Maps Place ID.'
                    return result

                # Get current value of 'Operational'
                current_operational_value = third_place['fields'].get('Operational', '')
                result['old_value'] = current_operational_value

                # Use Google Maps API to check operational status
                is_operational = self.google_maps_client.is_place_operational(place_id)
                new_operational_value = 'Yes' if is_operational else 'No'
                result['new_value'] = new_operational_value

                if current_operational_value == new_operational_value:
                    logging.info(f"Operational status for '{place_name}' is unchanged ({current_operational_value}). Skipping update.")
                    result['update_status'] = 'skipped'
                else:
                    # Update the 'Operational' field
                    update_result = self.update_place_record(
                        record_id,
                        'Operational',
                        new_operational_value,
                        overwrite=True
                    )
                    if update_result['updated']:
                        logging.info(f"Updated Operational status for '{place_name}' from '{current_operational_value}' to '{new_operational_value}'.")
                        result['update_status'] = 'updated'
                    else:
                        logging.warning(f"Failed to update Operational status for '{place_name}'.")
                        result['update_status'] = 'failed'
                        result['message'] = 'Update failed.'

            except Exception as e:
                logging.error(f"Error processing place '{place_name}': {e}")
                result['update_status'] = 'failed'
                result['message'] = str(e)

            return result

        # Process all places using threading to improve performance
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = {
                executor.submit(process_place, third_place): third_place['fields'].get('Place', 'Unknown Place')
                for third_place in self.all_third_places
            }
            for future in as_completed(futures):
                place_name = futures[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logging.error(f"Error processing place '{place_name}': {e}")
                    results.append({
                        'place_name': place_name,
                        'place_id': '',
                        'record_id': '',
                        'old_value': '',
                        'new_value': '',
                        'update_status': 'failed',
                        'message': str(e)
                    })

        return results
