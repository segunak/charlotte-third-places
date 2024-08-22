from unidecode import unidecode

def format_place_name(input_string: str) -> str:
    """
    Processes the provided string to create a formatted place name suitable for URLs or file names.
    This involves:
    - Removing any non-alphanumeric characters except dashes.
    - Replacing spaces with hyphens.
    - Converting to lowercase.
    - Handling accents and special characters to ensure only standard ASCII characters are used.

    Args:
        input_string (str): The original place name string to format.

    Returns:
        str: The formatted string in lowercase with non-alphanumeric characters replaced by hyphens.
    """

    # Normalize the string to remove accents and special characters, then convert to lowercase.
    normalized_string = unidecode(input_string).lower()

    # Replace spaces with hyphens.
    formatted_string = normalized_string.replace(" ", "-")

    # Keep only alphanumeric characters and hyphens, remove other characters.
    formatted_string = "".join(
        char if char.isalnum() or char == "-" else "" for char in formatted_string
    )

    # Replace multiple consecutive hyphens with a single one and strip hyphens from both ends.
    formatted_string = "-".join(part for part in formatted_string.split("-") if part)

    return formatted_string
