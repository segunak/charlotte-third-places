import os
import json
import logging
from datetime import datetime
from unidecode import unidecode

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