import logging
from datetime import datetime
from typing import Any, Dict, Optional
import whois

logger = logging.getLogger(__name__)


def _extract_single_date(date_val: Any) -> Optional[datetime]:
    """Handles cases where WHOIS dates are returned as lists or singular datetimes."""
    if isinstance(date_val, list):
        for val in date_val:
            if isinstance(val, datetime):
                return val
    elif isinstance(date_val, datetime):
        return date_val
    return None


def lookup_whois(domain: str) -> Dict[str, Any]:
    """Queries global registry servers to fetch WHOIS details for the domain.

    Returns:
        Dict[str, Any]: {
            "name": str,
            "age_days": int (default: -1 if unknown),
            "registrar": str,
            "creation_date": Optional[str],
            "expiry_date": Optional[str],
            "country": str
        }
    """
    default_res = {
        "name": domain,
        "age_days": -1,
        "registrar": "Unknown",
        "organization": "Unknown",
        "creation_date": None,
        "expiry_date": None,
        "country": "Unknown",
    }

    try:
        logger.debug(f"Querying WHOIS records for domain: {domain}")
        # Run WHOIS lookup
        w = whois.whois(domain)

        if not w or not w.domain_name:
            logger.warning(
                f"WHOIS lookup returned empty or invalid records for: {domain}"
            )
            return default_res

        creation = _extract_single_date(w.creation_date)
        expiry = _extract_single_date(w.expiration_date)

        age_days = -1
        if creation:
            age_days = (datetime.now() - creation).days
            # Clamp minimum age to 0
            age_days = max(age_days, 0)

        # Parse registrar
        registrar = w.registrar
        if isinstance(registrar, list) and registrar:
            registrar = str(registrar[0])
        elif not registrar:
            registrar = "Unknown"

        # Parse organization
        organization = w.org or w.organization
        if isinstance(organization, list) and organization:
            organization = str(organization[0])
        elif not organization:
            organization = "Unknown"

        # Parse country
        country = w.country
        if isinstance(country, list) and country:
            country = str(country[0])
        elif not country:
            country = "Unknown"

        logger.info(
            f"WHOIS query successful. Domain: {domain}, Age: {age_days} days, Registrar: {registrar}"
        )

        return {
            "name": domain,
            "age_days": age_days,
            "registrar": str(registrar).strip(),
            "organization": str(organization).strip(),
            "creation_date": creation.isoformat() if creation else None,
            "expiry_date": expiry.isoformat() if expiry else None,
            "country": str(country).strip(),
        }

    except Exception as err:
        logger.warning(
            f"WHOIS lookup failed for {domain} due to: {err}. Returning default details."
        )
        return default_res
