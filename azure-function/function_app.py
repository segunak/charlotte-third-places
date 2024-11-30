import os
import json
import logging
import jsonpickle
import azure.functions as func
from outscraper import ApiClient
from constants import SearchField
import helper_functions as helpers
import azure.durable_functions as df
from airtable_client import AirtableClient

app = df.DFApp(http_auth_level=func.AuthLevel.FUNCTION)

@app.function_name(name="StartOrchestrator")
@app.route(route="orchestrators/{functionName}")
@app.durable_client_input(client_name="client")
async def http_start(req: func.HttpRequest, client):
    """
    HTTP-triggered function that serves as the client and starts the orchestrator function. This is the entry point for the orchestration, and it's publicly accessible.
    """
    function_name = req.route_params.get('functionName')
    instance_id = await client.start_new(function_name)
    # This creates and sends a response that includes a URL to query the orchestration status
    response = client.create_check_status_response(req, instance_id)
    return response


@app.orchestration_trigger(context_name="context")
def get_outscraper_reviews_orchestrator(context: df.DurableOrchestrationContext):
    try:
        logging.info("get_outscraper_reviews_orchestrator started.")

        tasks = []
        airtable = AirtableClient()
        OUTSCRAPER_API_KEY = os.environ['OUTSCRAPER_API_KEY']
        outscraper = ApiClient(api_key=OUTSCRAPER_API_KEY)

        activity_input = {
            "airtable": jsonpickle.encode(airtable),
            "outscraper": jsonpickle.encode(outscraper)
        }

        for place in airtable.all_third_places:
            activity_input["place"] = place
            tasks.append(context.call_activity("get_outscraper_data_for_place", activity_input))

        # This runs all tasks in parallel. Similar to asyncio.gather in Python.
        results = yield context.task_all(tasks)
        logging.info(f"get_outscraper_reviews_orchestrator completed.")
        all_successful = all(result['status'] != 'failed' for result in results)
        custom_status = 'Succeeded' if all_successful else 'Failed'
        context.set_custom_status(custom_status)
        return results
    except Exception as ex:
        logging.error(f"Critical error in GetOutscraperReviews processing: {ex}", exc_info=True)
        error_response = json.dumps({"error": str(ex)}, indent=4)
        context.set_custom_status('Failed')
        return error_response


@app.activity_trigger(input_name="activityInput")
def get_outscraper_data_for_place(activityInput):

    place = activityInput['place']
    airtable = jsonpickle.decode(activityInput['airtable'])
    outscraper = jsonpickle.decode(activityInput['outscraper'])

    place_name = place['fields']['Place']
    logging.info(f"Getting reviews for place: {place_name}")

    place_id = place['fields'].get('Google Maps Place Id', None)
    place_id = airtable.google_maps_client.place_id_handler(place_name, place_id)

    if not place_id:
        return helpers.create_place_response('skipped', place_name, None, f"Warning! No place_id found for {place_name}. Skipping getting reviews.")

    airtable_record = airtable.get_record(SearchField.GOOGLE_MAPS_PLACE_ID, place_id)

    if airtable_record:
        has_reviews = airtable_record['fields'].get('Has Reviews', 'No')
        if has_reviews == 'Yes':
            return helpers.create_place_response('skipped', place_name, None, f"The place {place_name} with place_id {place_id} has a value of Yes in the Has Reviews column of the Airtable Base. To retrieve reviews, change the Has Reviews value to No.")
        else:
            logging.info(
                f"Airtable record found for place {place_name} with place_id {place_id} with a 'Has Reviews' column value of 'No' or empty.")
    else:
        logging.warning(
            f"No Airtable record found for place {place_name} with place_id {place_id}. Proceeding to attempt retrieval and saving of Outscraper data, but there's no Airtable record associated with this place to update.")

    # Reference https://app.outscraper.com/api-docs
    logging.info(f"Getting reviews for {place_name} with place_id {place_id}.")
    outscraper_response = outscraper.google_maps_reviews(
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
            logging.info(
                f"Incorrect allegiance provided. Expected {expected_value}, but got {req_body.get(expected_key, None)}")
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
            json.dumps({
                "success": False,
                "message": "Invalid request, please send valid JSON.",
                "data": None,
                "error": "Failed to parse JSON payload."
            }),
            status_code=400,
            mimetype="application/json"
        )

    if req_body.get("TheMotto") == "What is dead may never die, but rises again harder and stronger":
        logging.info("Validation successful, the provided motto matches the expected value.")

        try:
            airtable = AirtableClient()
            logging.info("AirtableClient instance created, starting the base data enrichment process.")

            enriched_places = airtable.enrich_base_data()
            logging.info("Base data enrichment completed. Proceeding to parse and filter updated places.")
            actually_updated_places = [
                {
                    "place_name": place["place_name"],
                    "place_id": place["place_id"],
                    "record_id": place["record_id"],
                    "field_updates": {
                        field: {
                            "old_value": updates["old_value"],
                            "new_value": updates["new_value"]
                        }
                        for field, updates in place.get('field_updates', {}).items() if updates["updated"]
                    }
                }
                for place in enriched_places if any(updates["updated"] for updates in place.get('field_updates', {}).values())
            ]

            if actually_updated_places:
                logging.info(f"Enrichment process completed successfully. The following places had at least one field updated: {actually_updated_places}")
            else:
                logging.info("Enrichment process completed successfully. No places required field updates.")

            logging.info("Running cover photo retrieval. The pass/fail of this operation will not impact overall function return values.")
            photo_results = airtable.get_place_photos(overwrite_cover_photo=True)
            photo_failures = any(result['status'] == "failed" for result in photo_results.values())

            if photo_failures:
                logging.error("The cover photo update process encountered failures.")
            else:
                logging.info("The cover photo update process completed successfully with no failures.")

            return func.HttpResponse(
                json.dumps({
                    "success": True,
                    "message": "Airtable base enrichment processed successfully.",
                    "data": {
                        "total_places_enriched": len(actually_updated_places),
                        "places_enriched": actually_updated_places
                    },
                    "error": None
                }),
                status_code=200,
                mimetype="application/json"
            )
        except Exception as ex:
            logging.error(f"Error encountered during the enrichment process: {ex}", exc_info=True)
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "message": "Server error occurred during the enrichment process.",
                    "data": None,
                    "error": str(ex)
                }),
                status_code=500,
                mimetype="application/json"
            )
    else:
        logging.info("Invalid or unauthorized attempt to access the endpoint with incorrect motto.")
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "message": "Unauthorized access. This endpoint requires a specific authorization motto to proceed.",
                "data": None,
                "error": "Incorrect authorization motto."
            }),
            status_code=403,
            mimetype="application/json"
        )

@app.function_name(name="RefreshAirtableOperationalStatuses")
@app.route(route="refresh-airtable-operational-statuses")
def refresh_airtable_operational_statuses(req: func.HttpRequest) -> func.HttpResponse:
    """
    This function calls `airtable.refresh_operational_statuses()`, which returns a detailed list of dictionaries with the status of each update.

    The function returns:
    - 200 OK if the function call completes and there are no return values in the list of dicts where `update_status` is 'failed'.
    - If there's a return value in the list of dicts with `update_status` 'failed', then it returns 500 Internal Server Error and includes every single record that had a 'failed' status in the return value.
    - Else, if all return values are 'updated' or 'skipped', it returns 200 OK and returns the entire return value for the caller to parse if they want to.
    - If there's an exception or big error, it returns an HTTP status that clearly indicates failure to the caller.

    Note: Callers of this Azure Function don't need to provide any input; security is handled via the `x-functions-key` header.

    Args:
        req (func.HttpRequest): The HTTP request object.

    Returns:
        func.HttpResponse: The HTTP response containing the operation results.
    """
    logging.info("Received request to refresh Airtable operational statuses.")

    try:
        airtable = AirtableClient()
        logging.info("AirtableClient instance created, starting to refresh operational statuses.")

        results = airtable.refresh_operational_statuses()
        logging.info("Operational statuses refreshed, processing results.")

        failed_updates = [res for res in results if res.get('update_status') == 'failed']

        if failed_updates:
            logging.error(f"Operational status updates failed for {len(failed_updates)} places.")
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "message": "One or more operational status updates failed.",
                    "data": failed_updates,
                    "error": None
                }),
                status_code=500,
                mimetype="application/json"
            )
        else:
            logging.info("Operational statuses refreshed successfully for all places.")
            return func.HttpResponse(
                json.dumps({
                    "success": True,
                    "message": "Operational statuses refreshed successfully.",
                    "data": results,
                    "error": None
                }),
                status_code=200,
                mimetype="application/json"
            )
    except Exception as ex:
        logging.error(f"Error encountered during the refresh operation: {ex}", exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "message": "Server error occurred during the refresh operation.",
                "data": None,
                "error": str(ex)
            }),
            status_code=500,
            mimetype="application/json"
        )
