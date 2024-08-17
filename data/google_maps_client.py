import os
import json
import dotenv
import logging
import requests
from datetime import datetime
from unidecode import unidecode

class GoogleMapsClient:
    """Class for common methods for interacting with the Google Maps API, regardless of the target database for recovered data.
    """
    def __init__(self):
        self.setup_logging()
        dotenv.load_dotenv()
        self.GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
        
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

    def strip_string(self, input_string):
        """Given a string, strip all special characters, punctuation, accents and the like from it. Return an alphanumeric characters only string in lowercase. Used for turning place name's into simple strings that can be used to name files and objects.
        """
        return unidecode(''.join(char for char in input_string if char.isalnum()).lower())

    def has_sufficient_reviews(self, place_name: str, review_threshold: int) -> bool:
        """
        Determines whether a place has a sufficient number of reviews stored locally compared to a specified threshold.
        It accounts only for reviews that are stored and filters out non-English and empty reviews.

        Args:
            place_name (str): The name of the place to check.
            review_threshold (int): The minimum number of reviews required for the place to be considered sufficiently reviewed.

        Returns:
            bool: True if the number of stored reviews meets or exceeds the review threshold, False otherwise.

        Note:
            This function assumes that reviews are stored in JSON files within a 'reviews' directory. Each file's name
            corresponds to the place name processed by `strip_string`, followed by '.json'.
        """
        review_file_path = f'./reviews/{self.strip_string(place_name)}.json'
        
        try:
            if os.path.exists(review_file_path):
                with open(review_file_path, 'r', encoding='utf8') as file:
                    reviews_data = json.load(file)
                    stored_reviews_count = len(reviews_data.get('reviews_data', []))
                    total_reviews_count = int(reviews_data.get('total_reviews_count', 0))
                    return stored_reviews_count >= min(review_threshold, total_reviews_count)
            else:
                return False
        except Exception as e:
            logging.error(f"Error processing review file: {e}")
            return False

    def get_google_reviews(self):
        pass
    
    def place_photo_new(self, photo_name: str, maxHeightPx :str, maxWidthPx: str):
        """
        Retrieves the photo details or the photo itself from Google Maps Places API based on the provided photo name.
        If `skipHttpRedirect` is set to True, the function returns JSON containing the photo URL details; otherwise,
        it attempts to fetch the actual photo.

        Documentation: https://developers.google.com/maps/documentation/places/web-service/place-photos

        Args:
            photo_name (str): The resource name of the photo as returned by a Place Details request.
            maxHeightPx (str): The maximum height of the photo in pixels, from 1 to 4800.
            maxWidthPx (str): The maximum width of the photo in pixels, from 1 to 4800.
            skipHttpRedirect (bool): If True, skips HTTP redirect and returns a JSON response with the photo details.

        Returns:
            dict: A JSON object containing the photo details or the actual photo, depending on `skipHttpRedirect`.
        """
        params = {
            'maxHeightPx': maxHeightPx,
            'maxWidthPx': maxWidthPx,
            'key': self.GOOGLE_MAPS_API_KEY,
            'skipHttpRedirect': 'true'
        }
        
        response = requests.get(f'https://places.googleapis.com/v1/{photo_name}/media', params=params)
        
        if response.status_code == requests.codes.ok:
            try:
                return response.json()
            except ValueError as e:
                logging.warning(f"Request succeeded, but there was an error parsing the JSON: {e}")
                return None
        else:
            logging.error(f"Request failed with status code: {response.status_code}. Response text: {response.text}")
            return None

    def text_search_new(self, text_query: str, fields: list) -> dict:
        """
        Performs a text search using the Google Maps Places API Text Search endpoint. Returns the API's
        JSON response containing the requested fields for the queried text.

        Documentation: https://developers.google.com/maps/documentation/places/web-service/text-search

        Args:
            text_query (str): The query text for which the search is performed.
            fields (list): Fields to be included in the API response.

        Returns:
            dict: The JSON response from the Google Maps API if the request is successful;
                None if there is an error in the request or response.
        """
        url = 'https://places.googleapis.com/v1/places:searchText'
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': ','.join(fields)
        }
        params = {
            "textQuery": text_query,
            'languageCode': 'en',
            # Example: Specifying a location bias within Charlotte, North Carolina
            "locationBias": {
                "circle": {
                    "center": {"latitude": 35.226826, "longitude": -80.843797},
                    "radius": 32000
                }
            }
        }

        try:
            response = requests.post(url, headers=headers, json=params)
            response.raise_for_status()  # Will raise an exception for HTTP error codes
            return response.json()
        except requests.exceptions.HTTPError as e:
            logging.error(f"HTTP error occurred: {e}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Error during requests to Google Maps API: {e}")
        except ValueError as e:
            logging.warning(f"Request succeeded, but there was an error parsing the JSON: {e}")
        
        return None

    def place_details_new(self, place_id: str, fields: list) -> dict:
        """
        Retrieves details for a specific place using the Google Maps Places API. This method constructs a request
        with specified fields and returns the response in JSON format.

        Documentation: https://developers.google.com/maps/documentation/places/web-service/place-details
        Field Return Values: https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places

        Args:
            place_id (str): The unique identifier for the place.
            fields (list): A list of strings representing the fields to be included in the response.

        Returns:
            dict: The JSON response from the Google Maps API if the request is successful and valid;
                None if the request fails or if the response is not JSON.
        """
        url = f'https://places.googleapis.com/v1/places/{place_id}?languageCode=en'
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': ','.join(fields)
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()  # Raises an HTTPError for bad responses
            return response.json()
        except requests.exceptions.HTTPError as e:
            logging.error(f"HTTP error occurred: {e}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Error during requests to Google Maps API: {e}")
        except ValueError as e:
            logging.warning(f"Request succeeded, but there was an error parsing the JSON: {e}")
        
        return None

    def find_place_id(self, place_name: str) -> str:
        """
        Retrieves the Google Maps Place Id for a given place name. Place Ids can change over time,
        thus requiring periodic verification. This function performs a text search to find the most
        current Place Id based on the place name provided.

        Read more at: https://developers.google.com/maps/documentation/places/web-service/place-id

        Args:
            place_name (str): The name of the place to find the Place Id for.

        Returns:
            str: The Google Maps Place Id if exactly one match is found; an empty string otherwise.
        """
        find_place_response = self.text_search_new(place_name, ['place_id'])
        places = find_place_response.get('places', []) if find_place_response else []
        
        if len(places) == 1:
            return places[0].get('id', '')
        else:
            # Log a warning with specific details if no place or multiple places are found
            if len(places) == 0:
                logging.warning(f"No Google Maps places found for the name {place_name}.")
            else:
                logging.warning(f"Found multiple matching Google Maps places for {place_name}. Be more specific or handle the ambiguity in your code. Results: {places}")
            return ''

    def validate_place_id(self, place_id: str) -> bool:
        """
        Checks if a place ID exists in the details retrieved from Google Maps. Place IDs can change 
        over time, so it's recommended to periodically refresh them. This operation incurs no cost 
        against the Places API.
        Reference: https://developers.google.com/maps/documentation/places/web-service/place-id#refresh-id

        Args:
            place_id (str): The ID of the place to be validated.

        Returns:
            bool: True if the 'id' key exists in the retrieved place details, False otherwise.
        """
        check_place_id = self.place_details_new(place_id, ['id'])
        return 'id' in check_place_id if check_place_id else False

    def place_id_handler(self, place_name, place_id) -> str:
        """
        Handle place_id interactions. Place Id's are Google's unique identifier for a place. 
        The database stores the place_id for every place, but they can change, which means 
        they need to be validated and/or refreshed from time to time. This function either 
        confirms the validity of an existing place_id and returns it, or tries to find a 
        place_id and return it. Either way, after calling this, you'll either have a valid 
        place_id or nothing at all, and can take action as needed.
        
        https://developers.google.com/maps/documentation/places/web-service/place-id
        """
        # Validate the place_id if it exists; otherwise, find a new one
        if place_id and self.validate_place_id(place_id):
            return place_id
        else:
            return self.find_place_id(place_name)

    def is_place_operational(self, place_id: str) -> bool:
        """
        Checks whether a place identified by its Google Maps Place ID is still operational.

        Args:
            place_id (str): The Google Maps Place ID of the location.

        Returns:
            bool: True if the place is operational or temporarily closed; False if permanently closed.

        Note:
            The function uses the 'businessStatus' field from the Google Maps API place details. The 'businessStatus' can have the following enum values:
            - BUSINESS_STATUS_UNSPECIFIED: Default value. This value is unused.
            - OPERATIONAL: The establishment is operational, not necessarily open now.
            - CLOSED_TEMPORARILY: The establishment is temporarily closed.
            - CLOSED_PERMANENTLY: The establishment is permanently closed.

            This method returns False only if the 'businessStatus' is 'CLOSED_PERMANENTLY'. In all other cases, including 
            when the status is unspecified, temporarily closed, or if the status cannot be determined (e.g., API failure or 
            missing 'businessStatus' in response), it returns True.
            
            Reference: https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#businessstatus
        """
        operational = True  # Default assumption: The place is operational
        place_details = self.place_details_new(place_id, ['businessStatus'])

        if place_details:
            business_status = place_details.get('businessStatus', 'BUSINESS_STATUS_UNSPECIFIED')
            # Determine operational status based on businessStatus
            operational = business_status != 'CLOSED_PERMANENTLY'

        if not operational:
            logging.warning(f"Unable to determine the business status for place ID {place_id} or it is permanently closed.")

        return operational
