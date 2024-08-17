import os
import sys
import json
import base64
import logging
import requests
import pyairtable
import azure.functions as func
import helper_functions as helpers
from pyairtable.formulas import match

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.function_name(name="OutscraperReviewsResponse")
@app.route(route="outscraper-reviews-response")
def outscraper_reviews_response(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Request received for Python HTTP trigger function OutscraperReviewsResponse.")
    
    try:
        # Parse the JSON body from the incoming HTTP request
        req_body = req.get_json()

        # Extract the 'results_location' URL from the request body
        results_location = req_body.get('results_location')
        
        if not results_location:
            return func.HttpResponse(
                "Missing results_location in the request body",
                status_code=400
            )
            
        # Make a HTTP GET request to the results_location URL
        print(results_location)
        response = requests.get(results_location)
        
        # Check if the request was successful
        if response.status_code != 200:
            return func.HttpResponse(
                f"Failed to fetch data from {results_location}: {response.text}",
                status_code=response.status_code
            )

        data = response.json()
        
        # Return the JSON data as the response of this function
        return func.HttpResponse(
            json.dumps(data),
            status_code=200,
            mimetype="application/json"
        )
    except json.JSONDecodeError:
        return func.HttpResponse(
            "Invalid JSON in request",
            status_code=400
        )
    except Exception as ex:
        return func.HttpResponse(
            str(ex),
            status_code=500
        )