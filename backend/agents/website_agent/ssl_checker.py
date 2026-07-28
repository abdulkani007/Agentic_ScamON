import logging
import socket
import ssl
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def _parse_ssl_date(date_str: str) -> Optional[datetime]:
    """Parses RFC-like date strings returned by getpeercert().

    Example: 'Jan 26 23:59:59 2027 GMT'
    """
    cleaned = date_str.replace("GMT", "").strip()
    cleaned = " ".join(cleaned.split())  # Collapse double spaces
    for fmt in ("%b %d %H:%M:%S %Y", "%b %d %H:%M:%S %Y %Z"):
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    return None


def _extract_issuer_org(issuer_data: Any) -> str:
    """Recursively walks through peer cert issuer tuples to extract issuer organization or common name."""
    try:
        for rdn in issuer_data:
            for item in rdn:
                # Look for organizationName or commonName
                if item[0] in ("organizationName", "commonName"):
                    return str(item[1])
    except Exception:
        pass
    return "Unknown Issuer"


def check_ssl(domain: str) -> Dict[str, Any]:
    """Initiates a secure socket connection to port 443 of the domain to verify SSL credentials.

    Returns:
        Dict[str, Any]: {
            "valid": bool,
            "issuer": str,
            "expiry": Optional[str]
        }
    """
    default_res = {"valid": False, "issuer": "Unknown", "expiry": None}

    # Don't try SSL check on localhosts or IPs
    if domain.lower() in ("localhost", "127.0.0.1"):
        return {"valid": True, "issuer": "Localhost Self-Signed", "expiry": None}

    try:
        logger.debug(f"Initiating SSL socket handshake for domain: {domain}")

        # Setup socket and connection parameters
        context = ssl.create_default_context()
        # Set short connection timeouts
        conn = context.wrap_socket(socket.socket(socket.AF_INET), server_hostname=domain)
        conn.settimeout(3.0)

        # Connect on port 443
        conn.connect((domain, 443))

        # Retrieve peer certificate details
        cert = conn.getpeercert()
        conn.close()

        if not cert:
            logger.warning(f"No SSL certificate returned by host: {domain}")
            return default_res

        issuer = _extract_issuer_org(cert.get("issuer", ()))
        expiry_str = cert.get("notAfter", "")
        expiry_dt = _parse_ssl_date(expiry_str) if expiry_str else None

        valid = False
        if expiry_dt:
            # Certificate is valid if expiration is in the future
            valid = expiry_dt > datetime.utcnow()

        logger.info(
            f"SSL validation successful. Domain: {domain}, Valid: {valid}, Issuer: {issuer}"
        )

        return {
            "valid": valid,
            "issuer": issuer,
            "expiry": expiry_dt.isoformat() if expiry_dt else None,
        }

    except Exception as err:
        logger.warning(
            f"SSL certificate check failed for {domain} due to: {err}. Treating as invalid SSL."
        )
        return default_res
