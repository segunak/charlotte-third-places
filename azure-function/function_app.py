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
logging.basicConfig(level=logging.INFO)

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
            logging.info(f"Incorrect allegiance provided. Expected {expected_value}, but got {req_body.get(expected_key, None)}")
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
        logging.info("Invalid or unauthorized attempt to access the endpoint with incorrect motto.")
        return func.HttpResponse(
            "Unauthorized access. This endpoint requires a specific authorization motto to proceed.",
            status_code=403
        )

@app.function_name(name="GetOutscraperReviews")
@app.route(route="get-outscraper-reviews")
def get_outscraper_reviews(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info("GetOutscraperReviews started.")
        airtable = AirtableClient()
        OUTSCRAPER_API_KEY = os.environ['OUTSCRAPER_API_KEY']
        outscraper_client = ApiClient(api_key=OUTSCRAPER_API_KEY)
        
        def process_place(place):
            place_name = unidecode(place['fields']['Place'])
            logging.info(f"Getting reviews for place: {place_name}")
            
            place_id = place['fields'].get('Google Maps Place Id', None)
            place_id = airtable.google_maps_client.place_id_handler(place_name, place_id)
            
            if not place_id:
                return_message = f"Warning! No place_id found for {place_name}. Skipping getting reviews."
                logging.info(return_message)
                return {'status': 'skipped', 'place_name': place_name, 'response': None, 'message': return_message}
            
            airtable_record = airtable.get_record(SearchField.PLACE_ID, place_id)
            has_reviews = airtable_record['fields'].get('Has Reviews', 'No')
            
            if has_reviews == 'Yes':
                return_message = f"The place {place_name} with place_id {place_id} has a value of Yes in the Has Reviews column of the Airtable Base. As such, reviews will not be retrieved for this place. To retrieve reviews, change the Has Reviews value for the record to No."
                logging.info(return_message)
                return {'status': 'skipped', 'place_name': place_name, 'response': None, 'message': return_message}
            
            # Reference https://app.outscraper.com/api-docs
            logging.info(f"Getting reviews for {place_name} with place_id {place_id}.")
            outscraper_response = outscraper_client.google_maps_reviews(
                place_id, limit=1, reviews_limit=500, sort='newest', language='en', ignore_empty=True
            )
            
            if not outscraper_response or len(outscraper_response) != 1:
                return_message = f"Error: Outscraper response was invalid for place {place_name} with place_id {place_id}. This could be because more than 1 place was returned, or some other error related to Outscraper. Response: {outscraper_response}. No reviews were saved for this place.."
                logging.info(return_message)
                return {'status': 'failed', 'place_name': place_name, 'response': outscraper_response, 'message': return_message}
            
            outscraper_reviews = outscraper_response[0]
            logging.info(f"Reviews successfully retrieved from Outscraper for {place_name}. Proceeding to save them.")
            
            reviews_file_dict = {
                "place_name": place_name,
                "place_id": place_id,
                "place_rating":  outscraper_reviews.get('rating', None),
                "place_total_reviews": outscraper_reviews.get('reviews', None),
                "place_google_id": outscraper_reviews.get('google_id', None),
                "place_reviews_id": outscraper_reviews.get('reviews_id', None),
                "place_reviews_link": outscraper_reviews.get('reviews_link', None)
            }
            
            reviews_data = [
                {
                    "review_id": review["review_id"],
                    "review_link": review["review_link"],
                    "review_rating": review["review_rating"],
                    "review_timestamp": review['review_timestamp'],
                    "review_datetime_utc": review["review_datetime_utc"],
                    "review_text": unidecode(review["review_text"])
                }
                for review in outscraper_reviews['reviews_data'] if review.get('review_text')
            ]
            
            reviews_file_dict['reviews_data'] = reviews_data
            
            full_file_path = f"data/outscraper/{place_id}.json"
            json_reviews_data = json.dumps(reviews_file_dict, indent=4)
            logging.info(f"Attempting to save reviews to GitHub at path {full_file_path}")
            save_succeeded = helpers.save_json_to_github(json_reviews_data, full_file_path)
            
            if save_succeeded:                
                if airtable_record:
                    airtable.update_place_record(airtable_record['id'], 'Has Reviews', 'Yes', overwrite=True)
                    logging.info(f"Airtable record for {place_name} updated successfully.")
                else:
                    logging.info(f"No corresponding Airtable record found for {place_name}.")

                return_message = f"Review processed and saved successfully for {place_name}."
                logging.info(return_message)
                return {'status': 'succeeded', 'place_name': place_name, 'response': f'https://github.com/segunak/charlotte-third-places/blob/master/{full_file_path}', 'message': return_message}

        logging.info("Starting review retrieval using parallel processing")
        call_results = []
        all_successful = True
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(process_place, place) for place in airtable.all_third_places]
            for future in as_completed(futures):
                result = future.result()
                if result:
                    call_results.append(result)
                    if result['status'] == 'failed':
                        all_successful = False
                        logging.info(f"Review retrieval failed for {result['place_name']}.")

        status_code = 200 if all_successful else 207
        return_json = json.dumps({"results": call_results}, indent=4)
        logging.info(f"GetOutscraperReviews completed with status code {status_code} and all_successful value of {all_successful}. Results: {return_json}")
        return func.HttpResponse(return_json, status_code=status_code, mimetype="application/json")

    except Exception as ex:
        logging.error(f"Critical error in GetOutscraperReviews processing: {ex}", exc_info=True)
        error_response = json.dumps({"error": ex}, indent=4)
        return func.HttpResponse(error_response, status_code=500, mimetype="application/json")
