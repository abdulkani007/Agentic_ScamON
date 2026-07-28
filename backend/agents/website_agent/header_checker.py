import logging
import requests
from typing import Any, Dict

logger = logging.getLogger(__name__)


def inspect_headers(url: str) -> Dict[str, Any]:
    """Audits HTTP headers for missing security controls (HSTS, CSP, etc.)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        logger.info(f"Inspecting HTTP headers for: {url}")
        response = requests.head(
            url, headers=headers, allow_redirects=True, timeout=5
        )
        resp_headers = response.headers

        headers_to_check = {
            "Content-Security-Policy": "Missing CSP",
            "X-Frame-Options": "Missing Clickjacking protection",
            "Strict-Transport-Security": "Missing HSTS",
            "X-Content-Type-Options": "Missing MIME sniffing protection",
        }

        findings = {}
        for h, default_label in headers_to_check.items():
            # Perform case-insensitive header lookup
            val = next(
                (v for k, v in resp_headers.items() if k.lower() == h.lower()),
                None,
            )
            findings[h] = val if val else default_label

        logger.info(f"Header audit completed for: {url}")
        return {
            "server": resp_headers.get("Server", "Unknown"),
            "findings": findings,
        }
    except Exception as err:
        logger.warning(f"Failed to inspect headers for {url}: {err}")
        return {
            "server": "Unknown",
            "findings": {
                "Content-Security-Policy": "Unknown",
                "X-Frame-Options": "Unknown",
                "Strict-Transport-Security": "Unknown",
                "X-Content-Type-Options": "Unknown",
            },
        }
