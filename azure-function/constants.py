from enum import Enum

class SearchField(Enum):
    """Enumeration of unique fields for searching records in the Airtable database.

    This Enum defines the fields that are considered unique identifiers within the Airtable
    'Charlotte Third Places' table. These fields can be used to efficiently search and retrieve
    specific records.
    """
    PLACE_NAME = "Place"
    GOOGLE_MAPS_PLACE_ID = "Google Maps Place Id"
