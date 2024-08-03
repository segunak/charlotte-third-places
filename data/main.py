from airtable_client import AirtableClient

airtable = AirtableClient()
airtable.enrich_base_data()
airtable.get_place_photos(overwrite_cover_photo=True)
airtable.data_quality_checks()