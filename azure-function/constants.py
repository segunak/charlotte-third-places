from enum import Enum

class SearchField(Enum):
    """Used by get_record_id in the Airtable client to restrict what callers can search using.
    """
    PLACE_ID = "Google Maps Place Id"
    PLACE_NAME = "Place"