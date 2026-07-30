from __future__ import annotations

import json
import time
from difflib import SequenceMatcher
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import httpx

from ...schemas import AgentState, ToolExecutionResult, URLFeatures

OFFICIAL_DOMAINS_PATH = Path(__file__).resolve().parents[2] / "datasets" / "official_domains.json"
SUSPICIOUS_PATTERNS = (
    "secure-login",
    "verify-account",
    "update-kyc",
    "bank-login",
    "signin-now",
    "login-now",
    "confirm-account",
    "account-verify",
    "login",
    "verify",
    "secure",
    "update",
)
SHORTENER_DOMAINS = {"bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "rb.gy"}


def load_official_domains() -> dict[str, list[str]]:
    return json.loads(OFFICIAL_DOMAINS_PATH.read_text(encoding="utf-8"))


def normalize_domain(url: URLFeatures) -> str | None:
    if url.domain:
        return url.domain.lower()

    parsed = urlparse(url.url)
    return parsed.netloc.lower() or None


def is_https(url: URLFeatures) -> bool:
    return (url.protocol or "").lower() == "https"


def is_shortened(url: URLFeatures) -> bool:
    domain = normalize_domain(url)
    return bool(domain and domain in SHORTENER_DOMAINS) or url.is_shortened


def parse_url(url: URLFeatures) -> dict[str, object]:
    parsed = urlparse(url.url)
    domain = normalize_domain(url)
    return {
        "url": url.url,
        "domain": domain,
        "path": parsed.path or "/",
        "protocol": parsed.scheme.lower() or None,
    }


def expand_shortened_url(url: URLFeatures) -> str:
    if not is_shortened(url):
        return url.url

    try:
        response = httpx.get(url.url, follow_redirects=True, timeout=10.0)
        final_url = str(response.url)
        return final_url or url.url
    except Exception:
        return url.url


def has_suspicious_pattern(domain: str | None) -> bool:
    if not domain:
        return False

    lowered = domain.lower()
    if lowered.count("-") >= 2:
        return True

    if any(pattern in lowered for pattern in SUSPICIOUS_PATTERNS):
        return True

    if any(bank in lowered for bank in ("sbi", "hdfc", "icici", "axis", "paytm")) and any(
        keyword in lowered for keyword in ("login", "verify", "secure", "update")
    ):
        return True

    return False


def matches_official_domain(domain: str | None, claimed_organization: str | None, official_domains: dict[str, list[str]]) -> bool:
    if not domain or not claimed_organization:
        return False

    candidate_domains = official_domains.get(claimed_organization, [])
    lowered_domain = domain.lower()
    return any(lowered_domain == official_domain.lower() for official_domain in candidate_domains)


def domain_similarity(domain: str | None, claimed_organization: str | None, official_domains: dict[str, list[str]]) -> int:
    if not domain or not claimed_organization:
        return 0

    candidate_domains = official_domains.get(claimed_organization, [])
    if not candidate_domains:
        return 0

    return max(
        int(round(SequenceMatcher(None, domain.lower(), official_domain.lower()).ratio() * 100))
        for official_domain in candidate_domains
    )


def risk_label(
    *,
    https_enabled: bool,
    shortened: bool,
    official_domain: bool,
    suspicious_pattern: bool,
) -> str:
    if official_domain and https_enabled and not shortened and not suspicious_pattern:
        return "low"
    if shortened or suspicious_pattern or not official_domain:
        return "high"
    if not https_enabled:
        return "medium"
    return "medium"


def run_website_verification(state: AgentState) -> ToolExecutionResult:
    started_at = time.perf_counter()
    checked_at = datetime.now(timezone.utc).isoformat()
    official_domains = load_official_domains()
    claimed_organization = state.extracted_features.organization
    urls = state.extracted_features.urls

    if not urls:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        return ToolExecutionResult(
            tool="website_verification",
            status="unavailable",
            data={},
            metadata={
                "reason": "No URLs were present in the SMS.",
                "checked_at": checked_at,
                "execution_time_ms": elapsed_ms,
            },
        )

    results: list[dict[str, object]] = []
    for url in urls:
        expanded_url = expand_shortened_url(url)
        parsed_url = URLFeatures(
            url=expanded_url,
            domain=urlparse(expanded_url).netloc.lower() or url.domain,
            path=urlparse(expanded_url).path or url.path,
            protocol=urlparse(expanded_url).scheme.lower() or url.protocol,
            is_shortened=is_shortened(url),
        )
        parsed = parse_url(parsed_url)
        domain = parsed["domain"] if isinstance(parsed["domain"], str) else None
        https_enabled = parsed["protocol"] == "https"
        shortened = is_shortened(url)
        official_domain = matches_official_domain(domain, claimed_organization, official_domains)
        similarity = domain_similarity(domain, claimed_organization, official_domains)
        suspicious_pattern = has_suspicious_pattern(domain)
        results.append(
            {
                "url": url.url,
                "expanded_url": expanded_url if expanded_url != url.url else None,
                "protocol": parsed["protocol"],
                "domain": domain,
                "path": parsed["path"],
                "https": https_enabled,
                "shortened": shortened,
                "official_domain": official_domain,
                "domain_similarity": similarity,
                "suspicious_pattern": suspicious_pattern,
                "risk": risk_label(
                    https_enabled=https_enabled,
                    shortened=shortened,
                    official_domain=official_domain,
                    suspicious_pattern=suspicious_pattern,
                ),
            }
        )

    elapsed_ms = int((time.perf_counter() - started_at) * 1000)

    return ToolExecutionResult(
        tool="website_verification",
        status="success",
        data={
            "claimed_organization": claimed_organization,
            "results": results,
        },
        metadata={
            "checked_at": checked_at,
            "execution_time_ms": elapsed_ms,
        },
    )
