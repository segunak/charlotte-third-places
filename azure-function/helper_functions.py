import os
import json
import dotenv
import base64
import logging
import requests
from datetime import datetime
from unidecode import unidecode
from azure.storage.filedatalake import DataLakeServiceClient

dotenv.load_dotenv()

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
    datalake_connection_string = os.environ['AzureWebJobsStorage']
    datalake_service_client = DataLakeServiceClient.from_connection_string(datalake_connection_string)
    file_system_client = datalake_service_client.get_file_system_client(file_system="data")
    directory_client = file_system_client.get_directory_client("reviews")
    file_client = directory_client.get_file_client(review_file_name)
    file_client.upload_data(data=json_data, overwrite=True)

def save_reviews_github(json_data, review_file_name):
    """ Saves the given JSON data to the specified file path in the GitHub repository. """
    try:
        github_token = os.environ['GITHUB_PERSONAL_ACCESS_TOKEN']
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        repo_name = "segunak/charlotte-third-places"
        branch = "master"
        
        # Check if the file exists to get the SHA
        # Reference https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
        url_get = f"https://api.github.com/repos/{repo_name}/contents/data/reviews/{review_file_name}?ref={branch}"
        get_response = requests.get(url_get, headers=headers)
        if get_response.status_code == 200:
            sha = get_response.json()['sha']
        else:
            sha = None  # If the file does not exist, we'll create a new file

        # Construct the data for the PUT request to create/update the file
        # Reference https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
        url_put = f"https://api.github.com/repos/{repo_name}/contents/data/reviews/{review_file_name}"
        commit_message = "Updating reviews data"
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