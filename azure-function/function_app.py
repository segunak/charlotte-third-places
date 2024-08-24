import os
import sys
import json
import logging
import requests
import pyairtable
import azure.functions as func
from unidecode import unidecode
from outscraper import ApiClient
import helper_functions as helpers
from pyairtable.formulas import match
from airtable_client import AirtableClient

# Reference https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4%2Cfunctionsv2&pivots=programming-language-python#http-auth
app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)
logging.basicConfig(level=logging.INFO)

# TO DO
# Call airtable code for getting photos locally and validate it works, then add it to the enrich Azure Function calls.
# Delete main.py and other unused code.
# Delete local debug Airtabel code
# Get missing place_id's manually and update airtable
# Work on filling gaps in the data manually
# Deploy Azure Function and hit enrichement endpoint from GitHub action and verify success.


# Write an Azure Function called from a GitHub Action that takes all the place_id's in the airtable and sends
# them to outsraper to get reiews for each one. Ensure outscraper is setup with the webhook URL for reviews response
# which will ensure they get saved.


# After verifying having all reviews, start on AI analysis for choosing ambience. Use Azure OpenAI, free $150 a month.

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

@app.function_name(name="EnrichAirtableBase")
@app.route(route="enrich-airtable-base")
def enrich_airtable_base(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            "Invalid request, please send valid JSON, or don't if you'-re a bad actor. Go away.",
            status_code=400
        )

    if req_body.get("TheMotto") == "What is dead may never die, but rises again harder and stronger":
        logging.info("Valid JSON body passed. Airtable enrichment starting.")
        try:
            airtable = AirtableClient()
            places_updated = airtable.enrich_base_data()
            airtable.get_place_photos(overwrite_cover_photo=True)
            logging.info(f"Airtable Base enrichment completed. The list of places updated is {places_updated}.")
            return func.HttpResponse(
                f"Airtable base enrichment processed successfully. The list of places updated: {places_updated}",
                status_code=200
            )
        except Exception as ex:
            logging.error(f"Error: Exception encountered enriching the Airtable Base. {ex}")
            return func.HttpResponse(
                f"Error: Exception encountered enriching the Airtable Base. {ex}",
                status_code=500
            )
    else:
        logging.warning("Unauthorized attempt to access the endpoint.")
        return func.HttpResponse(
            "Nice try, but this endpoint isn't for you fam. Go away!",
            status_code=403
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
        review_file_name = f"{place_id}-{place_name}-reviews.json"
        json_data = json.dumps(reviews_data, indent=4)

        save_status = helpers.save_reviews_github(json_data, review_file_name)
        if save_status:
            return func.HttpResponse(f"Review processed successfully for place {place_name} and saved to GitHub repo.", status_code=200)
        else:
            return func.HttpResponse("Failed to save reviews to GitHub.", status_code=500)

    except json.JSONDecodeError:
        return func.HttpResponse("Invalid JSON in request", status_code=400)
    except Exception as ex:
        return func.HttpResponse(str(ex), status_code=500)

@app.function_name(name="OutscraperReviewsRequest")
@app.route(route="outscraper-reviews-request")
def outscraper_request_reviews(req: func.HttpRequest) -> func.HttpResponse:
    airtable = AirtableClient()
    # you can get airtable.all_third_places, iterate through anything with an actual place_id and not none, empty,
    # send each one as a request to outscraper with a delay. Outscraper should then post the webhook
    # THen make the github action to call this.
    return func.HttpResponse("Not implemented", status_code=400)
