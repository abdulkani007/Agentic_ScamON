from __future__ import annotations

import re
from urllib.parse import urlparse

from ..schemas import (
    AgentState,
    EntityFeatures,
    ExtractedFeatures,
    KeywordCategories,
    OrganizationMatch,
    SenderFeatures,
    URLFeatures,
)

URL_PATTERN = re.compile(r"https?://[^\s]+", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\-\s]{7,}\d)")
AMOUNT_PATTERN = re.compile(r"(?:₹|Rs\.?|INR)\s?\d[\d,]*(?:\.\d{1,2})?", re.IGNORECASE)
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
UPI_PATTERN = re.compile(r"[a-zA-Z0-9.\-_+]+@(?:okaxis|okhdfcbank|okicici|oksbi|ybl|upi|paytm|apl|axl|ibl|sbi|hdfcbank|icici|kotak|indus|rbl|federal|sc|hsbc|citi|pnb|boi|bob|cnrb|union|vijaya|dena|allahabad|syndicate|oriental|corporation|andhra|obc|uco|idbi|idfc|idfcfirst|freecharge|mobikwik|airtel|jio|barodampay|aubank|equitas|esaf|ujjivan|utib|axis)")

SENDER_PATTERN = re.compile(r"^(?:from|sender)\s*:\s*(?P<sender>[A-Za-z0-9\-_]{2,20})$", re.IGNORECASE)
ALPHANUMERIC_SENDER_PATTERN = re.compile(
    r"^(?:(?P<prefix>[A-Z]{2})[-_])?(?P<identifier>[A-Z0-9]{3,10})$"
)
NUMERIC_SENDER_PATTERN = re.compile(r"^\+?\d{3,15}$")

ORGANIZATION_PATTERNS = {
    "SBI": re.compile(r"\bSBI\b", re.IGNORECASE),
    "HDFC": re.compile(r"\bHDFC\b", re.IGNORECASE),
    "ICICI": re.compile(r"\bICICI\b", re.IGNORECASE),
    "AXIS": re.compile(r"\bAXIS\b", re.IGNORECASE),
    "PAYTM": re.compile(r"\bPAYTM\b", re.IGNORECASE),
}
ORGANIZATION_ALIASES = {
    "SBI": ["SBI", "State Bank of India", "SBI Bank"],
    "HDFC": ["HDFC", "HDFC Bank", "Housing Development Finance Corporation"],
    "ICICI": ["ICICI", "ICICI Bank"],
    "AXIS": ["AXIS", "Axis Bank"],
    "PAYTM": ["PAYTM", "Paytm Payments Bank", "Paytm"],
}

KEYWORD_PATTERNS = {
    "otp": re.compile(r"\b(?:otp|one time password|verification code)\b", re.IGNORECASE),
    "payment": re.compile(r"\b(?:pay|payment|transfer|refund)\b", re.IGNORECASE),
    "kyc": re.compile(r"\bkyc\b", re.IGNORECASE),
    "urgency": re.compile(r"\b(?:urgent|immediately|now|expires?|suspended|blocked)\b", re.IGNORECASE),
}
INTENT_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "otp_request": [
        re.compile(r"\botp\b", re.IGNORECASE),
        re.compile(r"one[- ]time password", re.IGNORECASE),
        re.compile(r"verification code", re.IGNORECASE),
    ],
    "kyc_verification": [
        re.compile(r"\bkyc\b", re.IGNORECASE),
        re.compile(r"know your customer", re.IGNORECASE),
    ],
    "login_request": [
        re.compile(r"\blogin\b", re.IGNORECASE),
        re.compile(r"\bsign[- ]in\b", re.IGNORECASE),
        re.compile(r"\bverify account\b", re.IGNORECASE),
    ],
    "payment_request": [
        re.compile(r"\bpay\b", re.IGNORECASE),
        re.compile(r"\bpayment\b", re.IGNORECASE),
        re.compile(r"\btransfer\b", re.IGNORECASE),
    ],
    "refund_claim": [
        re.compile(r"\brefund\b", re.IGNORECASE),
        re.compile(r"\bcashback\b", re.IGNORECASE),
    ],
    "delivery_update": [
        re.compile(r"\bdelivery\b", re.IGNORECASE),
        re.compile(r"\bparcel\b", re.IGNORECASE),
        re.compile(r"\bshipment\b", re.IGNORECASE),
    ],
    "account_suspension": [
        re.compile(r"\bsuspend(?:ed|ing|s)?\b", re.IGNORECASE),
        re.compile(r"\bsuspension\b", re.IGNORECASE),
        re.compile(r"\bblocked\b", re.IGNORECASE),
        re.compile(r"\bdeactivated\b", re.IGNORECASE),
    ],
    "identity_verification": [
        re.compile(r"\bverif(?:y|ication)\b", re.IGNORECASE),
        re.compile(r"\bidentity\b", re.IGNORECASE),
        re.compile(r"\bconfirm your details\b", re.IGNORECASE),
    ],
    "reward_claim": [
        re.compile(r"\breward\b", re.IGNORECASE),
        re.compile(r"\bcongratulations\b", re.IGNORECASE),
        re.compile(r"\bwon\b", re.IGNORECASE),
    ],
    "prize_claim": [
        re.compile(r"\bprize\b", re.IGNORECASE),
        re.compile(r"\blottery\b", re.IGNORECASE),
        re.compile(r"\bwinner\b", re.IGNORECASE),
    ],
    "password_reset": [
        re.compile(r"\bpassword\b", re.IGNORECASE),
        re.compile(r"\breset\b", re.IGNORECASE),
    ],
    "security_alert": [
        re.compile(r"\bsecurity alert\b", re.IGNORECASE),
        re.compile(r"\bunauthorized\b", re.IGNORECASE),
        re.compile(r"\bsuspicious activity\b", re.IGNORECASE),
    ],
}
SHORTENER_DOMAINS = {"bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "rb.gy"}
TRAILING_URL_PUNCTUATION = ".,;:!?)]}\"'"


def normalize_sms_text(raw_sms: str) -> str:
    normalized = re.sub(r"\s+", " ", raw_sms).strip()
    return normalized


def normalize_url(raw_url: str) -> str:
    return raw_url.rstrip(TRAILING_URL_PUNCTUATION)


def extract_urls(text: str) -> list[URLFeatures]:
    extracted_urls: list[URLFeatures] = []
    seen_urls: set[str] = set()

    for raw_url in URL_PATTERN.findall(text):
        normalized_url = normalize_url(raw_url)
        if normalized_url in seen_urls:
            continue

        seen_urls.add(normalized_url)
        parsed = urlparse(normalized_url)
        domain = parsed.netloc.lower() or None
        extracted_urls.append(
            URLFeatures(
                url=normalized_url,
                domain=domain,
                path=(parsed.path or "/") if domain else (parsed.path or None),
                protocol=parsed.scheme.lower() or None,
                is_shortened=domain in SHORTENER_DOMAINS,
            )
        )

    return extracted_urls


def extract_amounts(text: str) -> list[str]:
    return list(dict.fromkeys(AMOUNT_PATTERN.findall(text)))


def extract_emails(text: str) -> list[str]:
    return list(dict.fromkeys(EMAIL_PATTERN.findall(text)))


def extract_upi_ids(text: str) -> list[str]:
    return list(dict.fromkeys(UPI_PATTERN.findall(text)))


def extract_phone_numbers(text: str) -> list[str]:
    return list(dict.fromkeys(m.group(0) for m in PHONE_PATTERN.finditer(text)))


def extract_entities(text: str) -> EntityFeatures:
    return EntityFeatures(
        amounts=extract_amounts(text),
        emails=extract_emails(text),
        upi_ids=extract_upi_ids(text),
        phones=extract_phone_numbers(text),
    )


def extract_phone_number(text: str) -> str | None:
    match = PHONE_PATTERN.search(text)
    return match.group(0) if match else None


def extract_sender_id(text: str) -> str | None:
    for line in text.splitlines():
        match = SENDER_PATTERN.match(line.strip())
        if match:
            return match.group("sender")
    return None


def parse_sender(raw_sender: str | None) -> SenderFeatures:
    if not raw_sender:
        return SenderFeatures(
            raw=None,
            type="unknown",
            prefix=None,
            identifier=None,
        )

    cleaned_sender = raw_sender.strip()

    numeric_match = NUMERIC_SENDER_PATTERN.match(cleaned_sender)
    if numeric_match:
        sender_type = "numeric_sender"
        if 3 <= len(cleaned_sender.lstrip("+")) <= 6:
            sender_type = "numeric_short_code"

        return SenderFeatures(
            raw=cleaned_sender,
            type=sender_type,
            prefix=None,
            identifier=cleaned_sender,
        )

    alphanumeric_match = ALPHANUMERIC_SENDER_PATTERN.match(cleaned_sender.upper())
    if alphanumeric_match:
        prefix = alphanumeric_match.group("prefix")
        identifier = alphanumeric_match.group("identifier")
        sender_type = "alphanumeric_sender"
        if prefix:
            sender_type = "alphanumeric_short_code"

        return SenderFeatures(
            raw=cleaned_sender,
            type=sender_type,
            prefix=prefix,
            identifier=identifier,
        )

    return SenderFeatures(
        raw=cleaned_sender,
        type="unknown",
        prefix=None,
        identifier=cleaned_sender,
    )


def resolve_organizations(text: str, urls: list[URLFeatures]) -> list[OrganizationMatch]:
    resolved_matches: list[OrganizationMatch] = []
    seen_canonical_names: set[str] = set()
    normalized_text = text.lower()

    for canonical_name, aliases in ORGANIZATION_ALIASES.items():
        for alias in sorted(aliases, key=len, reverse=True):
            if alias.lower() in normalized_text:
                confidence = 1.0 if alias.upper() == canonical_name else 0.9
                resolved_matches.append(
                    OrganizationMatch(
                        name=alias,
                        canonical_name=canonical_name,
                        confidence=confidence,
                    )
                )
                seen_canonical_names.add(canonical_name)
                break

    for url in urls:
        domain = (url.domain or "").lower()
        for canonical_name, aliases in ORGANIZATION_ALIASES.items():
            if canonical_name in seen_canonical_names:
                continue

            if canonical_name.lower() in domain:
                resolved_matches.append(
                    OrganizationMatch(
                        name=canonical_name,
                        canonical_name=canonical_name,
                        confidence=0.75,
                    )
                )
                seen_canonical_names.add(canonical_name)
                break

    if resolved_matches:
        return resolved_matches

    for organization, pattern in ORGANIZATION_PATTERNS.items():
        if pattern.search(text):
            return [
                OrganizationMatch(
                    name=organization,
                    canonical_name=organization,
                    confidence=0.8,
                )
            ]

    return []


def extract_keywords(text: str) -> list[str]:
    detected_keywords: list[str] = []

    for keyword, pattern in KEYWORD_PATTERNS.items():
        if pattern.search(text):
            detected_keywords.append(keyword)

    return detected_keywords


def detect_intents(text: str) -> list[str]:
    return [
        intent
        for intent, patterns in INTENT_PATTERNS.items()
        if any(pattern.search(text) for pattern in patterns)
    ]


def detect_language(_: str) -> str:
    return "en"


def build_extracted_features(raw_sms: str) -> tuple[str, ExtractedFeatures]:
    normalized_sms = normalize_sms_text(raw_sms)
    urls = extract_urls(normalized_sms)
    sender_id = extract_sender_id(raw_sms)
    sender = parse_sender(sender_id)
    organizations = resolve_organizations(normalized_sms, urls)
    keywords = extract_keywords(normalized_sms)
    intents = detect_intents(normalized_sms)
    entities = extract_entities(normalized_sms)

    features = ExtractedFeatures(
        sender=sender,
        organizations=organizations,
        urls=urls,
        intents=intents,
        entities=entities,
        keyword_categories=KeywordCategories(
            security=[keyword for keyword in keywords if keyword in {"otp", "kyc"}],
            payment=[keyword for keyword in keywords if keyword == "payment"],
            urgency=[keyword for keyword in keywords if keyword == "urgency"],
        ),
        language=detect_language(normalized_sms),
    )

    return normalized_sms, features


def observe_sms(state: AgentState) -> AgentState:
    normalized_sms, features = build_extracted_features(state.raw_sms)
    state.normalized_sms = normalized_sms
    state.extracted_features = features
    return state
