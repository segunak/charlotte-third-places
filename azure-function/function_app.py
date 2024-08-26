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
import azure.durable_functions as df
from airtable_client import AirtableClient

app = df.DFApp(http_auth_level=func.AuthLevel.FUNCTION)

# To Do
# Remove limiting code on durable function version of outscraper
# Update GitHub action to use powershell script for callling durable function

# HTTP-triggered function that serves as the client and starts the orchestrator function. This is the entry point for the orchestration, and it's publicly accessible.
@app.function_name(name="StartOrchestrator")
@app.route(route="orchestrators/{functionName}")
@app.durable_client_input(client_name="client")
async def http_start(req: func.HttpRequest, client):
    function_name = req.route_params.get('functionName')
    instance_id = await client.start_new(function_name)
    # This creates and sends a response that includes a URL to query the orchestration status
    response = client.create_check_status_response(req, instance_id)
    return response

# Orchestrator function. 
@app.orchestration_trigger(context_name="context")
def get_outscraper_reviews_orchestrator(context):
    result = yield context.call_activity("get_outscraper_reviews_activity", None)
    return result

# Activity Function
@app.activity_trigger(input_name="message")
def get_outscraper_reviews_activity(message):
    try:
        logging.info("Info: get_outscraper_reviews_activity started.")
        airtable = AirtableClient()
        OUTSCRAPER_API_KEY = os.environ['OUTSCRAPER_API_KEY']
        outscraper_client = ApiClient(api_key=OUTSCRAPER_API_KEY)

        def process_place(place):
            place_name = unidecode(place['fields']['Place'])
            logging.info(f"Getting reviews for place: {place_name}")     
        
            place_id = place['fields'].get('Google Maps Place Id', None)
            place_id = airtable.google_maps_client.place_id_handler(place_name, place_id)
            
            if not place_id:
                return helpers.create_place_response('skipped', place_name, None, f"Warning! No place_id found for {place_name}. Skipping getting reviews.")
            
            airtable_record = airtable.get_record(SearchField.PLACE_ID, place_id)
            
            if airtable_record:
                has_reviews = airtable_record['fields'].get('Has Reviews', 'No')
                if has_reviews == 'Yes':
                    return helpers.create_place_response('skipped', place_name, None, f"The place {place_name} with place_id {place_id} has a value of Yes in the Has Reviews column of the Airtable Base. To retrieve reviews, change the Has Reviews value to No.")
                else:
                    logging.info(f"Airtable record found for place {place_name} with place_id {place_id} with a 'Has Reviews' column value of 'No' or empty.")
            else:
                logging.warning(f"No Airtable record found for place {place_name} with place_id {place_id}. Proceeding to attempt retrieval and saving of Outscraper data, but there's no Airtable record associated with this place to update.")
                
            # Reference https://app.outscraper.com/api-docs
            logging.info(f"Getting reviews for {place_name} with place_id {place_id}.")
            outscraper_response = outscraper_client.google_maps_reviews(
                place_id, limit=1, reviews_limit=250, sort='newest', language='en', ignore_empty=True
            )
            
            if not outscraper_response:
                return helpers.create_place_response('failed', place_name, outscraper_response, f"Error: Outscraper response was invalid for place {place_name} with place_id {place_id}. Please review the logs for more details. No reviews were saved for this place.")
            
            logging.info(f"Reviews successfully retrieved from Outscraper for {place_name}. Proceeding to save them.")
            structured_outscraper_data = helpers.structure_outscraper_data(outscraper_response[0], place_name, place_id)
            
            full_file_path = f"data/outscraper/{place_id}.json"
            final_json_data = json.dumps(structured_outscraper_data, indent=4)
            logging.info(f"Attempting to save reviews to GitHub at path {full_file_path}")
            
            save_succeeded = helpers.save_json_to_github(final_json_data, full_file_path)
            
            if save_succeeded: 
                if airtable_record:
                    airtable.update_place_record(airtable_record['id'], 'Has Reviews', 'Yes', overwrite=True)
                    logging.info(f"Airtable column 'Has Reviews' updated for {place_name} updated successfully.")

                return helpers.create_place_response('succeeded', place_name, f'https://github.com/segunak/charlotte-third-places/blob/master/{full_file_path}', f"Data processed and saved successfully for {place_name}.")
            else:
                 return helpers.create_place_response('failed', place_name, None, f"Failed to save reviews to GitHub for {place_name} despite having got data back from Outscraper. Review the logs for more details.")               
          
        logging.info("Starting review retrieval using parallel processing")
        
        call_results = helpers.process_in_parallel(airtable.all_third_places[:1], process_place, 10)
        all_successful = all(result['status'] != 'failed' for result in call_results)
        status_code = 200 if all_successful else 207
        
        return_json = json.dumps({"results": call_results}, indent=4)
        logging.info(f"GetOutscraperReviews completed with status code {status_code} and all_successful value of {all_successful}. Results: {return_json}")
        
        return return_json

    except Exception as ex:
        logging.error(f"Critical error in GetOutscraperReviews processing: {ex}", exc_info=True)
        error_response = json.dumps({"error": ex}, indent=4)
        
        return error_response

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
