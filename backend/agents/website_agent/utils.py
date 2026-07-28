import logging
import re
from urllib.parse import urlparse


def setup_logging(log_level: str = "INFO") -> None:
    """Configures structured logs for the Website Agent."""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def normalize_url(url: str) -> str:
    """Ensures a URL string has a valid http/https scheme and strip whitespaces."""
    cleaned = url.strip()
    if not cleaned.lower().startswith(("http://", "https://")):
        cleaned = "https://" + cleaned
    return cleaned


def extract_domain(url: str) -> str:
    """Extracts raw domain name from a URL, stripping subdomains like www.

    Example: https://login.sbi.co.in/index.html -> sbi.co.in
    """
    normalized = normalize_url(url)
    parsed = urlparse(normalized)
    domain = parsed.netloc.split(":")[0]  # Remove port if present

    # Remove leading 'www.'
    if domain.lower().startswith("www."):
        domain = domain[4:]
    return domain
