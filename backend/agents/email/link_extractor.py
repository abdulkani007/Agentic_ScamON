import re
import logging
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from .schemas import LinkAnalysisInfo

logger = logging.getLogger(__name__)

def extract_urls_from_content(body_text: str, body_html: str) -> list[str]:
    """Extracts all unique HTTP/HTTPS URLs from plain text and HTML bodies."""
    urls = set()

    # 1. Extract from HTML anchors
    if body_html:
        try:
            soup = BeautifulSoup(body_html, "html.parser")
            for a in soup.find_all("a", href=True):
                href = a["href"].strip()
                if href.lower().startswith(("http://", "https://")):
                    urls.add(href)
        except Exception as err:
            logger.warning(f"Error parsing HTML anchors for URLs: {err}")

    # 2. Extract using regex from plain text body
    # Matches http/https URLs and excludes trailing punctuation common in text formatting
    regex_pattern = r'https?://[^\s<>"]+[\w/]'
    matches = re.findall(regex_pattern, body_text)
    for match in matches:
        # Strip trailing punctuation marks
        cleaned = match.strip(".,;:)('!?")
        if cleaned.lower().startswith(("http://", "https://")):
            urls.add(cleaned)

    return list(urls)

async def analyze_extracted_links(urls: list[str]) -> list[LinkAnalysisInfo]:
    """Passes extracted URLs to the existing Website Investigation Agent for modular threat scan."""
    from agents.website_agent.investigation_coordinator import run_modular_investigation
    from agents.website_agent.utils import normalize_url, extract_domain

    analyzed = []
    # Process up to 5 URLs to keep analysis fast and responsive
    for url in urls[:5]:
        try:
            normalized = normalize_url(url)
            domain = extract_domain(normalized)

            # Call Website Agent coordinator asynchronously
            logger.info(f"Reusing Website Agent to inspect URL: {normalized}")
            scan_res = await run_modular_investigation(normalized)

            analyzed.append(
                LinkAnalysisInfo(
                    url=url,
                    domain=domain,
                    risk_score=scan_res.get("risk_score", 0),
                    decision=scan_res.get("decision", "SAFE"),
                    reason=scan_res.get("reason", "Scan completed successfully.")
                )
            )
        except Exception as err:
            logger.error(f"Failed to scan link {url} via Website Agent: {err}")
            # Fallback safe report in case of failure to prevent pipeline blocking
            domain_fallback = urlparse(url).netloc or "unknown"
            analyzed.append(
                LinkAnalysisInfo(
                    url=url,
                    domain=domain_fallback,
                    risk_score=0,
                    decision="SAFE",
                    reason=f"Scan offline: {str(err)}"
                )
            )
            
    return analyzed
