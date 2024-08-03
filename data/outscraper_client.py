
import os
import sys
import json
import dotenv
import requests
import pyairtable
from pyairtable.formulas import match
from flask import Flask, request, json

class OutscraperClient:
    """Class for handling getting reviews for third places.
    """
    def __init__(self):
        dotenv.load_dotenv()
        AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
        AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')

app = Flask(__name__)

def strip_string(input_string): 
    """Given a string, strip all special characters, punctuation, accents and the like from it. Return an alphanumeric characters only string in lowercase. Used for turning place name's into simple strings that can be used to name files and objects."""
    from unidecode import unidecode
    return unidecode(''.join(char for char in input_string if char.isalnum()).lower())

@app.route('/reviewsresponse', methods=['POST'])
def reviewsResponse():
    data = request.json
    results = requests.get(data['results_location']).json()

    reviews_data = [
        {
            'review_id': review['review_id'],
            'review_link': review['review_link'],
            'review_rating': review['review_rating'],
            'review_datetime_utc': review['review_datetime_utc'],
            # Getting the review onto one line, and replacing weird unicode quotes with standard ASCII quotes.
            # This chained replace syntax irks me, but it's clearer than the suggestions at: 
            # https://stackoverflow.com/questions/6116978/how-to-replace-multiple-substrings-of-a-string
            'review_text': review['review_text'].replace('\n', ' ').replace(u"\u2018", "'").replace(u"\u2019", "'")
        }
        for review in results['data'][0]['reviews_data']
    ]

    charlotte_third_places = pyairtable.Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, 'Charlotte Third Places')
    formula = match({"Google Maps Place ID": results['data'][0]['place_id']})
    airtable_results = charlotte_third_places.all(formula=formula)
    airtable_place_name = airtable_results[0]['fields']['Place']

    reviews_output = {
        'place_name': airtable_place_name,
        'place_id': results['data'][0]['place_id'],
        'total_reviews_count': results['data'][0]['reviews'],
        'reviews_data': reviews_data
    }
    review_file_name = strip_string(airtable_place_name) + '.json'

    with open(f'./reviews/{review_file_name}', "w",  encoding='utf-8') as write_file:
        json.dump(reviews_output, write_file, ensure_ascii=False, indent=4)

    print(f"Done processing {airtable_place_name}")
    return data

# Start flask
app.run(debug=True, port=5000)
