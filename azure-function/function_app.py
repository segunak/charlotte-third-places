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

# airtable = AirtableClient()
# airtable_record = airtable.get_record(SearchField.PLACE_ID, 'ChIJJ1k-2i6gVogRYNxihxv5ONI')

# TO DO
# Make GitHub action for OutscraperReviewsRequest. Ensure results are printed.
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

        place_id = raw_reviews_data['data'][0]['place_id']
        place_name = helpers.format_place_name(raw_reviews_data['data'][0]['name'])
        review_file_name = f"{place_id}-{place_name}-reviews.json"
        json_data = json.dumps(reviews_data, indent=4)
        
        save_status = helpers.save_reviews_github(json_data, review_file_name)
        
        if save_status:
            airtable = AirtableClient()
            airtable_record = airtable.get_record(SearchField.PLACE_ID, place_id)
            
            if airtable_record:
                airtable.update_place_record(airtable_record['id'], 'Has Reviews', 'Yes', overwrite=True)
            else:
                logging.warning(f"Unable to update the Has Reviews column to Yes in the Airtable base despite having processed reviews successfully for place {place_name}.")
            
            return func.HttpResponse(f"Review processed successfully for place {place_name} and saved to GitHub repo.", status_code=200)
        else:
            return func.HttpResponse("Failed to save reviews to GitHub.", status_code=500)

    except json.JSONDecodeError:
        return func.HttpResponse("Invalid JSON in request", status_code=400)
    except Exception as ex:
        return func.HttpResponse(str(ex), status_code=500)

@app.function_name(name="OutscraperReviewsRequest")
@app.route(route="outscraper-reviews-request")
def outscraper_reviews_request(req: func.HttpRequest) -> func.HttpResponse:
    try:
        airtable = AirtableClient()
        OUTSCRAPER_API_KEY = os.environ['OUTSCRAPER_API_KEY']
        outscraper_client = ApiClient(api_key=OUTSCRAPER_API_KEY)

        def process_place(place):
            place_name = place['fields']['Place']
            place_id = place['fields'].get('Google Maps Place Id', None)
            place_id = airtable.google_maps_client.place_id_handler(place_name, place_id)

            return_value = {'place_name': place_name, 'response': None, 'message': ''}
            
            if not place_id:
                return_value['message'] = f"No place_id for {place_name}. Skipping reviews request."
                logging.warning(return_value['message'])
                return return_value

            try:
                response = outscraper_client.google_maps_reviews(
                    place_id, limit=1, reviews_limit=500, sort='newest', language='en'
                )
                if response.status_code in [200, 202]:
                    return_value['response'] = response.json()
                    return_value['message'] = f"Successfully requested reviews for {place_name}."
                    logging.info(return_value['message'])
                else:
                    return_value['message'] = f"Failed to request reviews for {place_name}. Response: {response.text}"
                    logging.error(return_value['message'])

            except Exception as ex:
                return_value['message'] = f"Exception while requesting reviews for {place_name}: {str(ex)}"
                logging.error(return_value['message'])

            return return_value

        call_results = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            # TODO - REMOVE THIS!!! limited_list should be airtable.all_third_places in futures
            limited_list = airtable.all_third_places[:1]
            futures = [executor.submit(process_place, place) for place in limited_list]
            for future in as_completed(futures):
                result = future.result()
                if result:
                    call_results.append(result)

        response_json = json.dumps({"results": call_results}, indent=4)
        return func.HttpResponse(response_json, status_code=200, mimetype="application/json")
    
    except Exception as ex:
        logging.error(f"Critical error in processing: {str(ex)}")
        error_response = json.dumps({"error": str(ex)}, indent=4)
        return func.HttpResponse(error_response, status_code=500, mimetype="application/json")
