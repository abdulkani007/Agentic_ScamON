import re
from typing import List

# Mapping from keyword names to pre-compiled case-insensitive regex patterns.
KEYWORD_PATTERNS = {
    "OTP": re.compile(r"\botp\b", re.IGNORECASE),
    "Bank": re.compile(r"\bbank(s)?\b", re.IGNORECASE),
    "KYC": re.compile(r"\bkyc\b", re.IGNORECASE),
    "Lottery": re.compile(r"\blotter(y|ies)\b", re.IGNORECASE),
    "Reward": re.compile(r"\breward(s)?\b", re.IGNORECASE),
    "Refund": re.compile(r"\brefund(s)?\b", re.IGNORECASE),
    "Verify": re.compile(r"\bverif(y|ies|ied|ication)\b", re.IGNORECASE),
    "Urgent": re.compile(r"\burgent(ly)?\b", re.IGNORECASE),
    "Customer Care": re.compile(r"\bcustomer\s+care\b", re.IGNORECASE),
    "Debit Card": re.compile(r"\bdebit\s+card(s)?\b", re.IGNORECASE),
    "Credit Card": re.compile(r"\bcredit\s+card(s)?\b", re.IGNORECASE),
    "UPI": re.compile(r"\bupi\b", re.IGNORECASE),
    "Account Blocked": re.compile(r"\baccount\s+blocked\b", re.IGNORECASE),
    "Click Link": re.compile(
        r"\bclick\s+(?:on\s+)?(?:the\s+)?link\b", re.IGNORECASE
    ),
}


def detect_keywords(text: str) -> List[str]:
    """Scans the given transcript for predefined security-related keywords.

    Args:
        text (str): The transcript text to analyze.

    Returns:
        List[str]: List of detected keywords.
    """
    if not text:
        return []

    detected = []
    for keyword, pattern in KEYWORD_PATTERNS.items():
        if pattern.search(text):
            detected.append(keyword)

    return detected
