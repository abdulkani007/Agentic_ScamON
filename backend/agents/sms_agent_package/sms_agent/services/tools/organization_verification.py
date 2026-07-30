from __future__ import annotations

import json
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import httpx

from ...schemas import AgentState, ToolExecutionResult

ORGANIZATIONS_PATH = Path(__file__).resolve().parents[2] / "datasets" / "organizations.json"
ORGANIZATION_CACHE_PATH = Path(__file__).resolve().parents[2] / "datasets" / "organization_cache.json"
GOOGLE_SEARCH_URL = "https://www.google.com/search"
GOOGLE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0.0.0 Safari/537.36"
    )
}
IGNORE_DOMAINS = {
    "google.com",
    "www.google.com",
    "accounts.google.com",
    "support.google.com",
    "policies.google.com",
}


def load_organizations() -> dict[str, dict[str, object]]:
    return json.loads(ORGANIZATIONS_PATH.read_text(encoding="utf-8"))


def load_organization_cache() -> dict[str, dict[str, object]]:
    if not ORGANIZATION_CACHE_PATH.exists():
        return {}
    return json.loads(ORGANIZATION_CACHE_PATH.read_text(encoding="utf-8"))


def save_organization_cache(cache: dict[str, dict[str, object]]) -> None:
    ORGANIZATION_CACHE_PATH.write_text(
        json.dumps(cache, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def load_all_organizations() -> dict[str, dict[str, object]]:
    organizations = dict(load_organizations())
    organizations.update(load_organization_cache())
    return organizations


def normalize_text(value: str | None) -> str:
    return (value or "").strip().casefold()


def canonicalize_key(value: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9]+", " ", value).strip()
    return normalized.upper() or value.strip().upper()


def build_alias_index(organizations: dict[str, dict[str, object]]) -> dict[str, str]:
    alias_index: dict[str, str] = {}
    for canonical_name, record in organizations.items():
        alias_index[normalize_text(canonical_name)] = canonical_name
        for alias in record.get("aliases", []):
            alias_index[normalize_text(str(alias))] = canonical_name
    return alias_index


def normalize_domain(domain: str | None) -> str | None:
    if not domain:
        return None
    lowered = domain.casefold()
    if lowered.startswith("www."):
        return lowered[4:]
    return lowered


def extract_candidate_domains(html: str) -> list[str]:
    candidates: list[str] = []
    for match in re.findall(r'href=[\'"](?P<url>https?://[^\'" <>]+)', html, flags=re.IGNORECASE):
        parsed = urlparse(match)
        domain = normalize_domain(parsed.netloc)
        if not domain or domain in IGNORE_DOMAINS:
            continue
        if domain not in candidates:
            candidates.append(domain)
    return candidates


def google_lookup_organization(organization: str) -> dict[str, object] | None:
    query = f"{organization} official website"
    response = httpx.get(
        GOOGLE_SEARCH_URL,
        params={"q": query, "hl": "en"},
        headers=GOOGLE_HEADERS,
        timeout=10.0,
        follow_redirects=True,
    )
    response.raise_for_status()

    candidate_domains = extract_candidate_domains(response.text)
    if not candidate_domains:
        return None

    official_domain = candidate_domains[0]
    official_name = organization.strip()
    canonical_name = canonicalize_key(official_name)

    return {
        "organization_exists": True,
        "organization": organization,
        "official_name": official_name,
        "canonical_name": canonical_name,
        "official_domain": official_domain,
        "official_domains": [official_domain],
        "official_sender_ids": [],
        "aliases": [organization.strip()],
        "confidence": 0.75,
        "source": "google_search",
    }


def resolve_from_local_dataset(organization: str, organizations: dict[str, dict[str, object]]) -> tuple[str | None, dict[str, object] | None]:
    alias_index = build_alias_index(organizations)
    canonical_name = alias_index.get(normalize_text(organization))
    if not canonical_name:
        return None, None
    return canonical_name, organizations[canonical_name]


def cache_google_result(result: dict[str, object]) -> None:
    cache = load_organization_cache().copy()
    cache_key = str(result.get("canonical_name") or result.get("official_name") or "").strip()
    if not cache_key:
        return

    cache[cache_key] = {
        "official_name": result.get("official_name"),
        "aliases": list(dict.fromkeys(result.get("aliases", []))),
        "official_domains": list(dict.fromkeys(result.get("official_domains", []))),
        "official_sender_ids": list(dict.fromkeys(result.get("official_sender_ids", []))),
    }
    save_organization_cache(cache)


def build_success_result(
    *,
    organization: str,
    canonical_name: str,
    record: dict[str, object],
    source: str,
    sender_id: str | None,
    observed_domains: list[str],
    started_at: float,
) -> ToolExecutionResult:
    elapsed_ms = int((time.perf_counter() - started_at) * 1000)
    official_domains = [str(domain) for domain in record.get("official_domains", [])]
    official_sender_ids = [str(sender_id) for sender_id in record.get("official_sender_ids", [])]
    official_name = str(record.get("official_name") or canonical_name)
    normalized_sender_id = normalize_text(sender_id)
    normalized_official_sender_ids = {normalize_text(value) for value in official_sender_ids}
    normalized_official_domains = {normalize_text(value) for value in official_domains}
    normalized_observed_domains = {normalize_text(value) for value in observed_domains}
    sender_matches = bool(normalized_sender_id and normalized_sender_id in normalized_official_sender_ids)
    domain_matches = bool(normalized_observed_domains & normalized_official_domains)

    return ToolExecutionResult(
        tool="organization_verification",
        status="success",
        data={
            "organization_exists": True,
            "organization": organization,
            "official_name": official_name,
            "canonical_name": canonical_name,
            "official_domain": official_domains[0] if official_domains else None,
            "official_domains": official_domains,
            "official_sender_ids": official_sender_ids,
            "observed_domains": observed_domains,
            "sender_matches": sender_matches,
            "domain_matches": domain_matches,
            "confidence": float(record.get("confidence", 1.0 if source == "local_dataset" else 0.75)),
            "source": source,
        },
        metadata={"execution_time_ms": elapsed_ms},
    )


def run_organization_verification(state: AgentState) -> ToolExecutionResult:
    started_at = time.perf_counter()
    organization = state.extracted_features.organization

    if not organization:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        return ToolExecutionResult(
            tool="organization_verification",
            status="unavailable",
            data={},
            metadata={
                "reason": "No organization was detected in the SMS.",
                "execution_time_ms": elapsed_ms,
            },
        )

    organizations = load_all_organizations()
    canonical_name, record = resolve_from_local_dataset(organization, organizations)
    if record:
        return build_success_result(
            organization=organization,
            canonical_name=canonical_name or organization,
            record=record,
            source="local_dataset",
            sender_id=state.extracted_features.sender_id,
            observed_domains=[url.domain.lower() for url in state.extracted_features.urls if url.domain],
            started_at=started_at,
        )

    try:
        google_result = google_lookup_organization(organization)
    except Exception as exc:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        return ToolExecutionResult(
            tool="organization_verification",
            status="unavailable",
            data={},
            metadata={
                "reason": f"Google lookup failed: {exc}",
                "organization": organization,
                "execution_time_ms": elapsed_ms,
            },
        )

    if not google_result:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        return ToolExecutionResult(
            tool="organization_verification",
            status="unavailable",
            data={},
            metadata={
                "reason": "Organization not found in local dataset and Google lookup returned no usable result.",
                "organization": organization,
                "execution_time_ms": elapsed_ms,
            },
        )

    cache_google_result(google_result)
    canonical_name = str(google_result.get("canonical_name") or canonicalize_key(organization))
    return build_success_result(
        organization=organization,
        canonical_name=canonical_name,
        record=google_result,
        source="google_search",
        sender_id=state.extracted_features.sender_id,
        observed_domains=[url.domain.lower() for url in state.extracted_features.urls if url.domain],
        started_at=started_at,
    )
