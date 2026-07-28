import logging
import requests
from bs4 import BeautifulSoup
from typing import Any, Dict

logger = logging.getLogger(__name__)


def extract_html_metadata(url: str) -> Dict[str, Any]:
    """Downloads website HTML and extracts page title, meta description, and keywords."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        logger.info(f"Extracting HTML metadata from: {url}")
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        title = soup.title.string.strip() if soup.title and soup.title.string else "Unknown"

        description = "Unknown"
        desc_meta = soup.find("meta", attrs={"name": "description"}) or soup.find(
            "meta", attrs={"property": "og:description"}
        )
        if desc_meta:
            description = desc_meta.get("content", "Unknown").strip()

        keywords = "Unknown"
        key_meta = soup.find("meta", attrs={"name": "keywords"})
        if key_meta:
            keywords = key_meta.get("content", "Unknown").strip()

        logger.info(f"HTML metadata extracted. Title: {title}")
        return {
            "title": title,
            "description": description,
            "keywords": keywords,
        }
    except Exception as err:
        logger.warning(f"Failed to extract HTML metadata for {url}: {err}")
        return {
            "title": "Unknown",
            "description": "Unknown",
            "keywords": "Unknown",
        }
