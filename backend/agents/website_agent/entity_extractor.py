import logging
from datetime import datetime
from typing import Any, Dict

logger = logging.getLogger(__name__)


def extract_entities(domain: str, whois_res: Dict[str, Any]) -> Dict[str, Any]:
    """Extracts structured entities from WHOIS records and domain identifiers.

    Returns:
        Dict[str, Any]: {
            "domain": str,
            "organization": str,
            "timestamp": str
        }
    """
    logger.debug(f"Extracting entities for domain: {domain}")

    organization = whois_res.get("organization", "Unknown")
    # If the organization matches placeholder defaults, map to empty string or default
    if organization in ("Unknown", "None", "Null"):
        organization = ""

    return {
        "organization": organization,
        "domain": domain,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
