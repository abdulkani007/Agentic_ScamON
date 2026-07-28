import re
from typing import Dict, List

# Compiled regex patterns for entity extraction
PHONE_PATTERN = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
)
URL_PATTERN = re.compile(
    r"\b(?:https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}|www\.[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?:/[^\s]*)?\b",
    re.IGNORECASE,
)
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
DATE_PATTERN = re.compile(
    r"\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b|"
    r"\b(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}?(?:st|nd|rd|th)?(?:,\s+|\s+)\d{4}\b",
    re.IGNORECASE,
)
TIME_PATTERN = re.compile(r"\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M|[ap]m)?\b")

# Matches sequences of 4 to 8 digits that are preceded by context keywords
OTP_NUM_PATTERN = re.compile(
    r"(?i)\b(?:otp|code|one[- ]time[- ]password|verification|pin)\b(?:\s+is)?[\s:=-]+(\d{4,8})\b"
)

# Common organization names in cybersecurity/banking context
SPECIFIC_ORGS = [
    "SBI",
    "PayPal",
    "Google",
    "Microsoft",
    "Amazon",
    "Netflix",
    "Apple",
    "Yahoo",
    "ScamShield",
    "IRS",
    "FTC",
]


def extract_organizations(text: str) -> List[str]:
    """Helper to extract organization names matching structured patterns or specific keywords."""
    orgs = []

    # 1. Search for specific predefined organizations (case-insensitive)
    for org in SPECIFIC_ORGS:
        match = re.search(r"\b" + re.escape(org) + r"\b", text, re.IGNORECASE)
        if match:
            matched_text = match.group(0)
            if matched_text not in orgs:
                orgs.append(matched_text)

    # 2. Search for capitalized names followed by standard corporate indicators
    structural_pattern = re.compile(
        r"\b[A-Z][a-zA-Z0-9']*(?:\s+[A-Z][a-zA-Z0-9']*)*\s+(?:Bank|Corp|Corporation|Inc|Incorporated|Ltd|Limited|Co|Company|Services|Technologies|Support|Care)\b"
    )
    for match in structural_pattern.finditer(text):
        matched_text = match.group(0).strip()
        if matched_text not in orgs:
            orgs.append(matched_text)

    return orgs


def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extracts all entities (Phone Number, Organization Name, URL, Email, Date,

    Time, OTP Number) from the given text.

    Args:
        text (str): The transcript text to process.

    Returns:
        Dict[str, List[str]]: A dictionary of extracted entities with keys
        matching
                              the requested entity names.
    """
    if not text:
        return {
            "Phone Number": [],
            "Organization Name": [],
            "URL": [],
            "Email": [],
            "Date": [],
            "Time": [],
            "OTP Number": [],
        }

    # Extract entities
    phones = [match.group(0) for match in PHONE_PATTERN.finditer(text)]
    urls = [match.group(0) for match in URL_PATTERN.finditer(text)]
    emails = [match.group(0) for match in EMAIL_PATTERN.finditer(text)]
    dates = [match.group(0) for match in DATE_PATTERN.finditer(text)]
    times = [match.group(0) for match in TIME_PATTERN.finditer(text)]

    # Deduplicate matching numbers
    otp_numbers = []
    for match in OTP_NUM_PATTERN.finditer(text):
        num = match.group(1)
        if num not in otp_numbers:
            otp_numbers.append(num)

    orgs = extract_organizations(text)

    # Deduplicate lists keeping order
    def unique(lst):
        seen = set()
        return [x for x in lst if not (x in seen or seen.add(x))]

    return {
        "Phone Number": unique(phones),
        "Organization Name": unique(orgs),
        "URL": unique(urls),
        "Email": unique(emails),
        "Date": unique(dates),
        "Time": unique(times),
        "OTP Number": unique(otp_numbers),
    }
