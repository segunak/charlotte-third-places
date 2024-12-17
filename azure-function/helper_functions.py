import os
import re
import json
import dotenv
import base64
import logging
import requests
import unicodedata
from datetime import datetime
from unidecode import unidecode
from typing import Iterable, Callable, Any, List
from azure.storage.filedatalake import DataLakeServiceClient
from concurrent.futures import ThreadPoolExecutor, as_completed

dotenv.load_dotenv()


def normalize_text(text: str) -> str:
    """
    Normalize the text to ensure consistent encoding, formatting, and case.
    This function will:
    1. Normalize Unicode characters to NFC form (Normalization Form C).
    2. Strip leading/trailing spaces.
    3. Remove newlines.
    4. Compress multiple spaces into one.
    5. Convert the text to lowercase for case-insensitive comparison.

    Args:
        text (str): The input text to normalize.

    Returns:
        str: The normalized string.
    """
    if isinstance(text, str):
        # Step 1: Normalize the text using NFC (Normalization Form C)
        text = unicodedata.normalize('NFC', text)

        # Step 2: Strip leading/trailing spaces and normalize whitespace
        text = re.sub(r'\s+', ' ', text.strip().lower())

    return text


def format_place_name(input_string: str) -> str:
    """
    Processes the provided string to create a formatted place name suitable for URLs or file names.
    This involves:
    - Removing any non-alphanumeric characters except dashes.
    - Replacing spaces with hyphens.
    - Converting to lowercase.
    - Handling accents and special characters to ensure only standard ASCII characters are used.

    Args:
        input_string (str): The original place name string to format.

    Returns:
        str: The formatted string in lowercase with non-alphanumeric characters replaced by hyphens.
    """

    # Normalize the string to remove accents and special characters, then convert to lowercase.
    normalized_string = unidecode(input_string).lower()

    # Replace spaces with hyphens.
    formatted_string = normalized_string.replace(" ", "-")

    # Keep only alphanumeric characters and hyphens, remove other characters.
    formatted_string = "".join(
        char if char.isalnum() or char == "-" else "" for char in formatted_string
    )

    # Replace multiple consecutive hyphens with a single one and strip hyphens from both ends.
    formatted_string = "-".join(part for part in formatted_string.split("-") if part)

    return formatted_string


def save_reviews_locally(airtable_place_name: str, reviews_output: dict):
    """
    Saves the provided reviews data into a JSON file within the 'reviews' directory.

    Args:
        airtable_place_name (str): Name of the place from Airtable to format for filename.
        reviews_output (dict): Dictionary containing the reviews data to be saved.
    """

    # Ensure the 'reviews' directory exists
    reviews_dir = "./data/reviews"
    os.makedirs(reviews_dir, exist_ok=True)

    # Format the filename and create the full path
    review_file_name = format_place_name(airtable_place_name) + ".json"
    review_file_path = os.path.join(reviews_dir, review_file_name)

    # Write the data to a JSON file
    with open(review_file_path, "w", encoding="utf-8") as write_file:
        json.dump(reviews_output, write_file, ensure_ascii=False, indent=4)


def save_reviews_azure(json_data, review_file_name):
    """
    Save review data as a JSON file to Azure Data Lake Storage.

    This function connects to Azure Data Lake Storage using the connection string 
    from the environment variable 'AzureWebJobsStorage'. It uploads the provided 
    JSON data into a file under the 'reviews' directory in the 'data' filesystem.

    Args:
        json_data (str): JSON-formatted string containing the review data.
        review_file_name (str): The name of the file to save in the 'reviews' directory.
    """
    try:
        # Retrieve the Azure Data Lake connection string
        datalake_connection_string = os.environ['AzureWebJobsStorage']
        logging.info("Retrieved Azure Data Lake connection string.")

        # Initialize the Data Lake Service Client
        datalake_service_client = DataLakeServiceClient.from_connection_string(datalake_connection_string)
        logging.info("Initialized DataLakeServiceClient.")

        # Get the file system and directory clients
        file_system_client = datalake_service_client.get_file_system_client(file_system="data")
        directory_client = file_system_client.get_directory_client("reviews")

        # Get the file client and upload data
        file_client = directory_client.get_file_client(review_file_name)
        file_client.upload_data(data=json_data, overwrite=True)
        logging.info(f"Successfully uploaded {review_file_name} to Azure Data Lake.")
    except Exception as e:
        logging.error(f"An unexpected error occurred while saving '{review_file_name}'.")
        logging.exception(e)


def save_json_to_github(json_data, full_file_path):
    """ Saves the given JSON data to the specified file path in the GitHub repository.

    full_file_path should include the folder and file name, no leading slash. For example
    "data/reviews/review-file.json"
    """
    try:
        github_token = os.environ['GITHUB_PERSONAL_ACCESS_TOKEN']
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        repo_name = "segunak/charlotte-third-places"
        branch = "develop"

        # Check if the file exists to get the SHA
        # Reference https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
        url_get = f"https://api.github.com/repos/{repo_name}/contents/{full_file_path}?ref={branch}"
        get_response = requests.get(url_get, headers=headers)
        if get_response.status_code == 200:
            sha = get_response.json()['sha']
        else:
            sha = None  # If the file does not exist, we'll create a new file

        # Construct the data for the PUT request to create/update the file
        # Reference https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
        url_put = f"https://api.github.com/repos/{repo_name}/contents/{full_file_path}"
        commit_message = "Saving JSON file via save_json_to_github utility function"
        data = {
            "message": commit_message,
            "content": base64.b64encode(json_data.encode()).decode(),
            "branch": branch
        }
        if sha:
            data['sha'] = sha  # If updating an existing file, we need to provide the SHA

        # Make the PUT request to create/update the file
        put_response = requests.put(url_put, headers=headers, data=json.dumps(data))
        return put_response.status_code in {200, 201}

    except Exception as e:
        logging.error(f"Failed to save to GitHub: {str(e)}")
        return False


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


def create_place_response(operation_status, target_place_name, http_response_data, operation_message):
    """
    Constructs a structured response dictionary with details about an operation performed on a place.

    This function logs the operation message and returns a dictionary that encapsulates the status of
    the operation, the name of the place involved, the response data obtained (if any), and a descriptive
    message about the outcome.

    Args:
        operation_status (str): A custom status string indicating the outcome of the operation,
                                used by callers to determine further actions.
        target_place_name (str): The name of the place that was the focus during the data retrieval operation.
        http_response_data (dict or None): The actual data received from the HTTP call to retrieve information
                                           about the place. This can be None if no data was retrieved.
        operation_message (str): A custom message providing additional details about the operation's outcome,
                                 intended for logging and informing the caller.

    Returns:
        dict: A dictionary that includes the operation status, place name, any response data, and a detailed message.
    """
    if operation_status == 'failed':
        logging.warning(operation_message)
    else:
        logging.info(operation_message)

    return {
        'status': operation_status,
        'place_name': target_place_name,
        'response': http_response_data,
        'message': operation_message
    }


def structure_outscraper_data(outscraper_response, place_name, place_id):
    """
    Creates a structured dictionary containing detailed review information for a specific place.

    This function transforms raw review data retrieved from the Outscraper API into a structured
    dictionary that is easier to handle and display in client applications or to store in databases.

    Args:
        outscraper_response (Dict[str, Any]): A dictionary containing raw data from the Outscraper API.
        place_name (str): The name of the place for which reviews are being processed.
        place_id (str): The unique identifier for the place in the database or API.

    Returns:
        Dict[str, Any]: A dictionary that includes comprehensive details about the place and its reviews,
                        including metadata like ratings and individual review details such as text and ratings.

    The function includes a list comprehension that filters and processes individual reviews only if
    they contain textual content, ensuring that only meaningful data is included in the final dictionary.
    """
    logging.info("Started structure_outscraper_data")

    structured_data = {
        "place_name": place_name,
        "place_id": place_id,
        "place_description": outscraper_response.get('description', None),
        "place_rating":  outscraper_response.get('rating', None),
        "place_total_reviews": outscraper_response.get('reviews', None),
        "place_google_id": outscraper_response.get('google_id', None),
        "place_reviews_id": outscraper_response.get('reviews_id', None),
        "place_reviews_link": outscraper_response.get('reviews_link', None),
        "reviews_data": [
            {
                "review_id": review["review_id"],
                "review_link": review["review_link"],
                "review_rating": review["review_rating"],
                "review_timestamp": review['review_timestamp'],
                "review_datetime_utc": review["review_datetime_utc"],
                "review_text": unidecode(review["review_text"])
            }
            for review in outscraper_response['reviews_data'] if review.get('review_text')
        ]
    }

    logging.info("Completed structure_outscraper_data")

    return structured_data


def process_in_parallel(items: Iterable[Any], process_func: Callable[[Any], Any], max_workers: int = 10) -> List[Any]:
    """
    Process an iterable of items in parallel using the provided function.

    Args:
    items (Iterable[Any]): The iterable of items to process.
    process_func (Callable[[Any], Any]): The function to apply to each item.
    max_workers (int): The maximum number of worker threads to use. Defaults to 10.

    Returns:
    List[Any]: A list of results from the processing function, excluding None results.
    """
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_func, item) for item in items]
        return [future.result() for future in as_completed(futures) if future.result() is not None]
