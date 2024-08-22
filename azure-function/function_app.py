import os
import sys
import json
import logging
import requests
import pyairtable
import azure.functions as func
from unidecode import unidecode
import helper_functions as helpers
from pyairtable.formulas import match
from airtable_client import AirtableClient
from azure.storage.filedatalake import DataLakeServiceClient

bfdsgrafdafdasfdsafdsafdsafdassfdsa
gr2222 ```````````112`

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.function_name(name="SmokeTest")
@app.route(route="smoke-test")
def smoke_test(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        expected_key = "House"
        expected_value = "Martell"

        if req_body.get(expected_key, None) == expected_value:
            return func.HttpResponse(
                json.dumps({"message": "The Azure Function is operational and recognizes Dorne. Unbowed. Unbent. Unbroken."}),
                status_code=200,
                mimetype="application/json"
            )
        else:
            return func.HttpResponse(
                json.dumps({"message": "Unexpected or incorrect allegiance provided."}),
                status_code=400,
                mimetype="application/json"
            )
    except ValueError:
        return func.HttpResponse(
            json.dumps({"message": "Invalid or missing JSON body. Are you sure you should be hitting this endpoint?"}),
            status_code=400,
            mimetype="application/json"
        )

@app.function_name(name="OutscraperReviewsResponse")
@app.route(route="outscraper-reviews-response")
def outscraper_reviews_response(req: func.HttpRequest) -> func.HttpResponse:
    logging.info(
        "Request received for Python HTTP trigger function OutscraperReviewsResponse."
    )

    try:
        # Parse the JSON body from the incoming HTTP request
        req_body = req.get_json()

        # Extract the 'results_location' URL from the request body
        results_location = req_body.get("results_location")

        if not results_location:
            return func.HttpResponse(
                "Processing Failed: The request body was missing the results_location property.", status_code=400
            )

        results_location_response = requests.get(results_location)

        if results_location_response.status_code != 200:
            return func.HttpResponse(
                f"Failed to fetch data from {results_location}: {results_location_response.text}",
                status_code=results_location_response.status_code,
            )

        raw_reviews_data = results_location_response.json()
        
        reviews_data = [
            {
                "place_name": unidecode(review["name"]),
                "place_id": review['place_id'],
                "place_rating": review['rating'],
                "place_total_reviews": review['reviews'],
                # See https://outscraper.com/place-id-feature-id-cid/ for google_id explainer.
                "place_google_id": review['google_id'],
                "review_id": review["review_id"],
                "review_link": review["review_link"],
                "review_rating": review["review_rating"],
                "review_timestamp": review['review_timestamp'],
                "review_datetime_utc": review["review_datetime_utc"],
                "review_text": unidecode(review["review_text"])
            }
            for review in raw_reviews_data['data']
            # Only include reviews where text is not None and not just whitespace
            if review["review_text"] and review["review_text"].strip()
        ]

        place_id = helpers.format_place_name(raw_reviews_data['data'][0]['place_id'])
        place_name = helpers.format_place_name(raw_reviews_data['data'][0]['name'])

        datalake_connection_string = os.environ['AzureWebJobsStorage']
        datalake_service_client = DataLakeServiceClient.from_connection_string(datalake_connection_string)
        file_system_client = datalake_service_client.get_file_system_client(file_system="data")
        directory_client = file_system_client.get_directory_client("reviews")
        file_client = directory_client.get_file_client(f"{place_id}-{place_name}-reviews.json")
        
        json_data = json.dumps(reviews_data, indent=4)
        file_client.upload_data(data=json_data, overwrite=True)

        return func.HttpResponse(f"Review processed successfully for place {place_name} with place Id {place_id}", status_code=200)
    except json.JSONDecodeError:
        return func.HttpResponse("Invalid JSON in request", status_code=400)
    except Exception as ex:
        return func.HttpResponse(str(ex), status_code=500)
