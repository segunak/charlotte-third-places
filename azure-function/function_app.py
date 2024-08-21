import os
import sys
import json
import logging
import requests
import pyairtable
import azure.functions as func
from pyairtable.formulas import match
from airtable_client import AirtableClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

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
                "Error: Missing results_location in the request body.", status_code=400
            )

        response = requests.get(results_location)

        if response.status_code != 200:
            return func.HttpResponse(
                f"Failed to fetch data from {results_location}: {response.text}",
                status_code=response.status_code,
            )

        data = response.json()

        # Now get into saving the reviews as .json files in an Azure Storage Account
        # secret values can go into local.settings which turns into configuration values in the cloud.
        # look into that piece. The return value should be a empty 200 ok when everything works right.
        
        airtable = AirtableClient()
        print("Just gave life to the Airtable client. Doing nothing yet.")

        # Return the JSON data as the response of this function
        return func.HttpResponse(
            json.dumps(data), status_code=200, mimetype="application/json"
        )
    except json.JSONDecodeError:
        return func.HttpResponse("Invalid JSON in request", status_code=400)
    except Exception as ex:
        return func.HttpResponse(str(ex), status_code=500)
