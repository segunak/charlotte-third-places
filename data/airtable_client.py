import os
import json
import pprint
import dotenv
import logging
import requests
import pyairtable
from pyairtable import utils
from datetime import datetime
from collections import Counter
from urllib.parse import urlparse
from google_maps_client import GoogleMapsClient

class AirtableClient: 
    """Defines methods for interaction with the Charlotte Third Places Airtable database.
    """
    def __init__(self):
        self.setup_logging()
        self.google_maps_client = GoogleMapsClient()
        self.AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')
        self.AIRTABLE_PERSONAL_ACCESS_TOKEN = os.getenv(
            'AIRTABLE_PERSONAL_ACCESS_TOKEN')
        self.charlotte_third_places = pyairtable.Table(
            self.AIRTABLE_PERSONAL_ACCESS_TOKEN, self.AIRTABLE_BASE_ID, 'Charlotte Third Places')
        self.all_third_places = self.charlotte_third_places.all(sort=["Place"])

    def setup_logging(self):
        """Set up logging to file and console in the directory where the class file is located."""
        # Determine the directory of the current script
        dir_path = os.path.dirname(os.path.realpath(__file__))

        # Create 'logs' directory in the same directory as the script
        log_directory = os.path.join(dir_path, "logs")
        if not os.path.exists(log_directory):
            os.makedirs(log_directory)
            print("Log directory created at:", log_directory)
        else:
            print("Log directory already exists:", log_directory)
        
        # Define the filename using the current time
        class_name = self.__class__.__name__.lower()
        current_time = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        log_filename = os.path.join(log_directory, f"{class_name}-log-{current_time}.txt")

        # Configure basic logging
        logging.basicConfig(level=logging.INFO,
                            format='%(asctime)s - %(levelname)s - %(message)s',
                            handlers=[
                                logging.FileHandler(log_filename),
                                logging.StreamHandler()
                            ])

        # Log that setup is complete
        logging.info("Logging setup complete - logging to console and file.")

    def update_place_record(self, record_id: str, field_to_update: str, update_value, overwrite: bool) -> bool:
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
            place_name = record['fields'].get('Place', 'Unknown Place')
            current_value = record['fields'].get(field_to_update)

            # Determine if update should proceed
            if current_value is None or (overwrite and update_value is not None and current_value != update_value):
                self.charlotte_third_places.update(record_id, {field_to_update: update_value})
                logging.info(f'Field update PROCESSED for {field_to_update} at place {place_name} with new value: {update_value}.\n')
                return True
            else:
                logging.info(f'Field update SKIPPED for field {field_to_update} at place {place_name}. The existing value of {current_value} was NOT overwritten with the provided value of {update_value}.\n')
                return False
        except KeyError as e:
            logging.error(f"Missing expected field in the record. {e}")
            return False
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            return False
  
    def get_base_url(self, url: str) -> str:
        """
        Extracts and returns the base URL (scheme, domain, and path) from a full URL.

        Args:
            url (str): The full URL from which to extract the base.

        Returns:
            str: The base URL.
        """
        parsed_url = urlparse(url)
        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}".strip()

    def get_parking_status(self, place_details_response):
        """
        Determines the parking status of a place based on available parking options.

        Args:
            place_details_response (dict): The dictionary containing details about the place, including parking options.

        Returns:
            str: "Free" if any free parking options are available,
                 "Paid" if only paid or valet parking options are available,
                 "Unknown" if no parking information is available or if the options don't fit into the above categories.
        
        Reference: https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#parkingoptions
        """
        parking_options = place_details_response.get('parkingOptions', {})

        # Check for free parking availability
        free_parking_keys = ["freeParkingLot", "freeStreetParking", "freeGarageParking"]
        if any(parking_options.get(key, False) for key in free_parking_keys):
            return "Free"

        # Check for paid parking availability
        paid_parking_keys = ["paidParkingLot", "paidStreetParking", "paidGarageParking", "valetParking"]
        if any(parking_options.get(key, False) for key in paid_parking_keys):
            return "Paid"

        # Default to "Unknown" if no specific parking types are found
        return "Unknown"
    
    def determine_purchase_requirement(self, place_details_response):
        """
        Determines if a purchase is required based on the price level of a place.

        Args:
            place_details_response (dict): Response from Google Maps API containing the price level information.

        Returns:
            str: "Yes" if purchase is required, "No" if not, and "Unknown" if the status cannot be determined.
        """
        # Define a mapping of price levels to purchase requirements. The right hand values are the answer to the question
        # "Does this place require a purchase to hangout?"
        price_level_mapping = {
            'PRICE_LEVEL_UNSPECIFIED': 'Unknown',
            'PRICE_LEVEL_FREE': 'No',
            'PRICE_LEVEL_INEXPENSIVE': 'Yes',
            'PRICE_LEVEL_MODERATE': 'Yes',
            'PRICE_LEVEL_EXPENSIVE': 'Yes',
            'PRICE_LEVEL_VERY_EXPENSIVE': 'Yes'
        }

        # Get the price level from the response, defaulting to 'PRICE_LEVEL_UNSPECIFIED' if not found
        price_level = place_details_response.get('priceLevel', 'PRICE_LEVEL_UNSPECIFIED')

        # Return the corresponding purchase requirement, default to 'Unknown' if the price level is not in the mapping
        return price_level_mapping.get(price_level, 'Unknown')

    def enrich_base_data(self):
        """
        Enriches the base data of places stored in Airtable with additional metadata fetched from Google Maps.
        This method iterates over all places, retrieves details from Google Maps, and updates the Airtable records
        accordingly. This process automates the enrichment of data such as neighborhood, website URL, and parking options.

        It logs an update for each record and a warning if unable to fetch data for a place.
        """
        for third_place in self.all_third_places:
            # Retrieve place name and record ID from Airtable data
            place_name = third_place['fields'].get('Place', 'Unknown Place')
            record_id = third_place['id']
            place_id = third_place['Google Maps Place Id']
            # Fetch the Google Maps place ID using a helper method
            place_id = self.google_maps_client.place_id_handler(place_name, place_id)
            
            # Fetch additional details from Google Maps using the place ID
            place_details_response = self.google_maps_client.place_details_new(
                place_id, [
                    'googleMapsUri', 'websiteUri', 'formattedAddress', 'editorialSummary', 
                    'addressComponents', 'parkingOptions', 'priceLevel', 'paymentOptions', 
                    'primaryType', 'outdoorSeating'
                ])

            # Check if the response was successful
            if place_details_response:
                # Extract and process the website URL
                website = self.get_base_url(place_details_response.get('websiteUri'))
                # Get the list of address components
                address_components = place_details_response.get('addressComponents', [])
                
                # Use a generator to find the first 'neighborhood' component, if present
                neighborhood = next(
                    (component.get('longText', '').title() for component in address_components if 'neighborhood' in component.get('types', [])), ''
                )
                
                parking_situation = self.get_parking_status(place_details_response)
                purchase_required = self.determine_purchase_requirement(place_details_response)
                
                # Prepare a dictionary of fields to update in Airtable. Format is 'Field Name': (field_value, overwrite_flag)
                field_updates = {
                    'Google Maps Place Id': (place_id, True),
                    'Google Maps Profile URL': (place_details_response.get('googleMapsUri'), True),
                    'Neighborhood': (neighborhood, False),
                    'Website': (website, False),
                    'Address': (place_details_response.get('formattedAddress'), False),
                    'Description': (place_details_response.get('editorialSummary', {}).get('text'), False),
                    'Purchase Required': (purchase_required, False),
                    'Parking': (parking_situation, False)
                }

                # Update each field in the Airtable record as necessary
                for field_name, (field_value, overwrite) in field_updates.items():
                    self.update_place_record(record_id, field_name, field_value, overwrite)

            else:
                # Log a warning if the place details could not be fetched
                logging.warning(f'The record for place {place_name} cannot be updated. Unable to generate a valid place details request.')

    def get_place_photos(self, overwrite_cover_photo=False):
        """
        Retrieves and saves cover photos for each place in the Charlotte Third Places database using the Google Maps Place Photos API. It selects the first photo returned by the API as the cover photo and saves it locally.
        """
        for third_place in self.all_third_places:
            record_id = third_place['id']
            place_id = third_place['Google Maps Place Id']
            place_name = third_place['fields'].get('Place', 'Unknown Place')
            place_id = self.google_maps_client.place_id_handler(place_name, place_id)
            place_details_response = self.google_maps_client.place_details_new(place_id, ['photos'])

            if 'photos' in place_details_response:
                # Use the first photo as the cover
                photo_name = place_details_response['photos'][0]['name']
                place_photos_response = self.google_maps_client.place_photo_new(photo_name, '4800', '4800')
                modified_place_name = place_name.strip().lower().replace(" ", "-")
                
                if place_photos_response:
                    photo_file_name = f'{modified_place_name}-{place_id}-cover.jpg'
                    photo_url = place_photos_response['photoUri']      
                    self.update_place_record(record_id, 'Cover Photo URL', photo_url, True)
                    self.save_photo_locally( f'./photos/{place_id}', photo_file_name, photo_url)
                else:
                    logging.warning(f'Unable to retrieve photos for {place_name}.')
            else:
                logging.warning(f'No photos available for {place_name}.')

    def save_photo_locally(self, photo_folder, photo_name, photo_url):
        """
        Helper function to save a photo locally in the specified directory.
        """
        os.makedirs(photo_folder, exist_ok=True)
        with open(f'{photo_folder}/{photo_name}', 'wb') as photo_handler:
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
        multiple_occurrences = {value: count for value, count in field_values_count.items() if count > 1}

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

