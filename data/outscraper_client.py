import os
import sys
import json
import base64
import dotenv
import requests
import pyairtable
from pyairtable.formulas import match
from flask import Flask, request, json

"""
Running this file kicks off a Flask server that serves as a webhook endpoint for an Outscraper post
triggered by requesting reviews for a given place. This code, in it's current state, must be running
locally to pick up the post request from Outscraper. Future state could involve turning this into an
Azure Function that picks up the response and saves it to the GitHub repo, or some other storage
solution.

"run" (don't debug) this script then use Outscraper-LocalTestScript.ps1 to validate it.

In Outscraper, kick off a request at https://app.outscraper.com/googleReviews. Make sure under advanced 
settings you're getting the data back as XLSX. That's just for downloading, the actual API side always returns
JSON. If you set that advanced setting to JSON you get "data to big" as an error message.
"""

app = Flask(__name__)

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
    from unidecode import unidecode

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

@app.route("/reviews-response", methods=["POST"])
def reviewsResponse():
    data = request.json
    results = requests.get(data["results_location"]).json()

    dotenv.load_dotenv()
    AIRTABLE_BASE_ID = os.environ["AIRTABLE_BASE_ID"]
    AIRTABLE_PERSONAL_ACCESS_TOKEN = os.environ["AIRTABLE_PERSONAL_ACCESS_TOKEN"]

    reviews_data = [
        {
            "review_id": review["review_id"],
            "review_link": review["review_link"],
            "review_rating": review["review_rating"],
            "review_datetime_utc": review["review_datetime_utc"],
            # Getting the review onto one line, and replacing weird unicode quotes with standard ASCII quotes.
            # This chained replace syntax irks me, but it's clearer than the suggestions at:
            # https://stackoverflow.com/questions/6116978/how-to-replace-multiple-substrings-of-a-string
            "review_text": review["review_text"]
            .replace("\n", " ")
            .replace("\u2018", "'")
            .replace("\u2019", "'"),
        }
        for review in results["data"]
        # Only include reviews where text is not None and not just whitespace
        if review["review_text"] and review["review_text"].strip()
    ]

    charlotte_third_places = pyairtable.Table(
        AIRTABLE_PERSONAL_ACCESS_TOKEN, AIRTABLE_BASE_ID, "Charlotte Third Places"
    )
    match_formula = match({"Google Maps Place ID": results["data"][0]["place_id"]})
    airtable_results = charlotte_third_places.all(formula=match_formula)
    airtable_place_name = airtable_results[0]["fields"]["Place"]

    reviews_output = {
        "place_name": airtable_place_name,
        "place_id": results["data"][0]["place_id"],
        "total_reviews_count": len(reviews_data),
        "reviews_data": reviews_data,
    }

    save_reviews_locally(airtable_place_name, reviews_output)

    print(f"Done processing {airtable_place_name}")
    return data

# Start flask
app.run(debug=True, port=5000)
