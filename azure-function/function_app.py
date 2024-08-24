import os
import sys
import json
import logging
import requests
import azure.functions as func
from unidecode import unidecode
from outscraper import ApiClient
from constants import SearchField
import helper_functions as helpers
from airtable_client import AirtableClient
from concurrent.futures import ThreadPoolExecutor, as_completed

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# TO DO
# Test OutScraperReviewsREquest then remove limiting code.
# Test enrich airtable base.
# Trigger OutsraperReviewsREquest with all functions.
# After verifying having all reviews, start on AI analysis for choosing ambience. Use Azure OpenAI, free $150 a month.

@app.function_name(name="SmokeTest")
@app.route(route="smoke-test")
def smoke_test(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Received request at SmokeTest endpoint.")

    try:
        req_body = req.get_json()
        logging.info(f"Request body parsed successfully: {req_body}")

        expected_key = "House"
        expected_value = "Martell"

        if req_body.get(expected_key, None) == expected_value:
            logging.info("Request body contains the correct allegiance.")
            return func.HttpResponse(
                json.dumps({"message": "The Azure Function is operational and recognizes Dorne. Unbowed. Unbent. Unbroken."}),
                status_code=200,
                mimetype="application/json"
            )
        else:
            logging.warning(f"Incorrect allegiance provided. Expected {expected_value}, but got {req_body.get(expected_key, None)}")
            return func.HttpResponse(
                json.dumps({"message": "Unexpected or incorrect allegiance provided."}),
                status_code=400,
                mimetype="application/json"
            )

    except Exception as ex:
        logging.error(f"Failed to parse request body as JSON. {ex}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"message": "Invalid or missing JSON body. Are you sure you should be hitting this endpoint?"}),
            status_code=400,
            mimetype="application/json"
        )

@app.function_name(name="EnrichAirtableBase")
@app.route(route="enrich-airtable-base")
def enrich_airtable_base(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Received request for Airtable base enrichment.")

    try:
        req_body = req.get_json()
        logging.info("JSON payload successfully parsed from request.")
    except ValueError:
        logging.error("Failed to parse JSON payload from the request.", exc_info=True)
        return func.HttpResponse(
            "Invalid request, please send valid JSON. This endpoint requires specific access rights.",
            status_code=400
        )

    # Verifying the secret motto to authorize the enrichment process
    if req_body.get("TheMotto") == "What is dead may never die, but rises again harder and stronger":
        logging.info("Validation successful, the provided motto matches the expected value.")

        try:
            airtable = AirtableClient()
            logging.info("AirtableClient instance created, starting the base data enrichment process.")

            places_updated = airtable.enrich_base_data()
            logging.info("Base data enrichment completed. Proceeding to update place photos.")

            airtable.get_place_photos(overwrite_cover_photo=True)
            logging.info(f"Photos updated successfully. Total places enriched: {len(places_updated)}.")

            return func.HttpResponse(
                f"Airtable base enrichment processed successfully. Places updated: {places_updated}",
                status_code=200
            )
        except Exception as ex:
            logging.error(f"Error encountered during the enrichment process: {ex}", exc_info=True)
            return func.HttpResponse(
                f"Server error occurred during the enrichment process: {ex}",
                status_code=500
            )
    else:
        logging.warning("Invalid or unauthorized attempt to access the endpoint with incorrect motto.")
        return func.HttpResponse(
            "Unauthorized access. This endpoint requires a specific authorization motto to proceed.",
            status_code=403
        )

@app.function_name(name="OutscraperReviewsResponse")
@app.route(route="outscraper-reviews-response")
def outscraper_reviews_response(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Request received for OutscraperReviewsResponse.")

    try:
        req_body = req.get_json()
        logging.info("JSON body parsed successfully.")

        results_location = req_body.get("results_location")
        logging.info(f"Results location extracted: {results_location}")

        if not results_location:
            logging.error("The request body is missing the results_location property.", exc_info=True)
            return func.HttpResponse("Processing Failed: Missing results_location in the request body.", status_code=400)

        results_location_response = requests.get(results_location)
        logging.info(f"HTTP GET request made to {results_location}")

        if results_location_response.status_code != 200:
            logging.error(f"Failed to fetch data from {results_location}: HTTP {results_location_response.status_code}", exc_info=True)
            return func.HttpResponse(
                f"Failed to fetch data from {results_location}: {results_location_response.text}",
                status_code=results_location_response.status_code
            )

        raw_reviews_data = results_location_response.json()
        logging.info("Reviews data fetched and parsed successfully.")

        reviews_data = [
            {
                "place_name": unidecode(review["name"]),
                "place_id": review['place_id'],
                "place_rating": review['rating'],
                "place_total_reviews": review['reviews'],
                "place_google_id": review['google_id'],
                "review_id": review["review_id"],
                "review_link": review["review_link"],
                "review_rating": review["review_rating"],
                "review_timestamp": review['review_timestamp'],
                "review_datetime_utc": review["review_datetime_utc"],
                "review_text": unidecode(review["review_text"])
            } 
            for review in raw_reviews_data['data'] 
            if review.get("review_text", "").strip()
        ]

        logging.info(f"Filtered and processed {len(reviews_data)} reviews.")

        place_id = raw_reviews_data['data'][0]['place_id']
        place_name = helpers.format_place_name(raw_reviews_data['data'][0]['name'])
        review_file_name = f"{place_id}-{place_name}-reviews.json"
        json_data = json.dumps(reviews_data, indent=4)
        save_status = helpers.save_reviews_github(json_data, review_file_name)
        logging.info(f"Attempting to save reviews to GitHub as {review_file_name}")

        if save_status:
            airtable = AirtableClient()
            airtable_record = airtable.get_record(SearchField.PLACE_ID, place_id)

            if airtable_record:
                airtable.update_place_record(airtable_record['id'], 'Has Reviews', 'Yes', overwrite=True)
                logging.info(f"Airtable record for {place_name} updated successfully.")
            else:
                logging.warning(f"No corresponding Airtable record found for {place_name}.")

            return func.HttpResponse(f"Review processed and saved successfully for {place_name}.", status_code=200)
        else:
            logging.error("Failed to save reviews to GitHub.", exc_info=True)
            return func.HttpResponse("Failed to save reviews to GitHub.", status_code=500)

    except json.JSONDecodeError:
        logging.error("Invalid JSON in request.", exc_info=True)
        return func.HttpResponse("Invalid JSON in request.", status_code=400)
    except Exception as ex:
        logging.error(f"An unexpected error occurred: {ex}", exc_info=True)
        return func.HttpResponse(f"Internal server error: {ex}", status_code=500)

@app.function_name(name="OutscraperReviewsRequest")
@app.route(route="outscraper-reviews-request")
def outscraper_reviews_request(req: func.HttpRequest) -> func.HttpResponse:
    """
    This function asynchronously requests reviews for places stored in Airtable using the Outscraper API.
    It returns 200 OK only if all place reviews are successfully fetched.
    Returns 207 for partial successes and 500 for any internal errors.
    """
    try:
        logging.info("Request handler started for OutscraperReviewsRequest.")
        airtable = AirtableClient()
        OUTSCRAPER_API_KEY = os.environ['OUTSCRAPER_API_KEY']
        outscraper_client = ApiClient(api_key=OUTSCRAPER_API_KEY)

        def process_place(place):
            place_name = unidecode(place['fields']['Place'])
            logging.info(f"Processing place: {place_name}")
            
            place_id = place['fields'].get('Google Maps Place Id', None)
            place_id = airtable.google_maps_client.place_id_handler(place_name, place_id)

            if not place_id:
                return_message = f"No place_id found for {place_name}. Skipping review request."
                logging.warning(return_message)
                return {'place_name': place_name, 'response': None, 'message': return_message}

            try:
                # Reference https://app.outscraper.com/api-docs#tag/Reviews-and-Comments/paths/~1maps~1reviews-v3/get
                logging.info(f"Requesting reviews for {place_name} with place_id {place_id}.")
                outscraper_response = outscraper_client.google_maps_reviews(
                    place_id, limit=1, reviews_limit=500, sort='newest', language='en'
                )
                
                # Ensure successful HTTP response. If the status code is an error one this will raise an HTTP exception.
                outscraper_response.raise_for_status()

                if outscraper_response.status_code in [200, 202]:
                    return_message = f"Reviews successfully retrieved for {place_name}."
                    logging.info(return_message)
                    return {'place_name': place_name, 'response': outscraper_response.json(), 'message': return_message}
                else:
                    return_message = f"Failed to retrieve reviews for {place_name}, HTTP status: {outscraper_response.status_code}."
                    logging.error(return_message, exc_info=True)
                    return {'place_name': place_name, 'response': None, 'message': return_message}

            except Exception as ex:
                return_message = f"Exception while requesting reviews for {place_name}: {ex}"
                logging.error(return_message, exc_info=True)
                return {'place_name': place_name, 'response': None, 'message': return_message}

        logging.info("Starting to process places for reviews using ThreadPoolExecutor.")
        call_results = []
        all_successful = True
        with ThreadPoolExecutor(max_workers=10) as executor:
            
            # TODO - REMOVE THIS!!! limited_list should be airtable.all_third_places in futures
            limited_list = airtable.all_third_places[:1]
            
            futures = [executor.submit(process_place, place) for place in limited_list]
            for future in as_completed(futures):
                result = future.result()
                if result:
                    call_results.append(result)
                    if not result['response']:
                        all_successful = False
                        logging.info(f"Review retrieval failed for {result['place_name']}.")

        status_code = 200 if all_successful else 207
        return_json = json.dumps({"results": call_results}, indent=4)
        logging.info(f"OutscraperReviewsRequest completed with status code {status_code} and all_successful value of {all_successful}. Results: {return_json}")
        return func.HttpResponse(return_json, status_code=status_code, mimetype="application/json")

    except Exception as ex:
        logging.error(f"Critical error in processing: {ex}", exc_info=True)
        error_response = json.dumps({"error": ex}, indent=4)
        return func.HttpResponse(error_response, status_code=500, mimetype="application/json")
