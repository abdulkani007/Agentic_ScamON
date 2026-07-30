from __future__ import annotations

import json
import time
from functools import lru_cache
from pathlib import Path

from ...schemas import AgentState, ToolExecutionResult

TRUSTED_SENDERS_PATH = Path(__file__).resolve().parents[2] / "datasets" / "trusted_senders.json"


@lru_cache(maxsize=1)
def load_trusted_senders() -> dict[str, dict[str, object]]:
    return json.loads(TRUSTED_SENDERS_PATH.read_text(encoding="utf-8"))


def normalize_sender_key(sender_key: str) -> list[str]:
    cleaned = sender_key.strip()
    uppercased = cleaned.upper()
    compact = "".join(ch for ch in uppercased if ch.isalnum() or ch == "+")

    candidates = [cleaned, uppercased]
    if compact not in candidates:
        candidates.append(compact)

    digits_only = "".join(ch for ch in cleaned if ch.isdigit() or ch == "+")
    if digits_only and digits_only not in candidates:
        candidates.append(digits_only)

    return candidates


def lookup_sender_record(sender_key: str) -> tuple[str | None, dict[str, object] | None]:
    trusted_senders = load_trusted_senders()

    for candidate in normalize_sender_key(sender_key):
        record = trusted_senders.get(candidate)
        if record:
            return candidate, record

    return None, None


def run_sender_reputation(state: AgentState) -> ToolExecutionResult:
    started_at = time.perf_counter()
    sender_key = state.extracted_features.sender_id or state.extracted_features.phone_number

    if not sender_key:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        return ToolExecutionResult(
            tool="sender_reputation",
            status="unavailable",
            data={},
            metadata={
                "reason": "No sender ID or phone number was available for reputation lookup.",
                "execution_time_ms": elapsed_ms,
            },
        )

    matched_key, record = lookup_sender_record(sender_key)
    elapsed_ms = int((time.perf_counter() - started_at) * 1000)

    if not record:
        return ToolExecutionResult(
            tool="sender_reputation",
            status="unavailable",
            data={},
            metadata={
                "reason": "Sender not found in local reputation dataset.",
                "lookup_value": sender_key,
                "execution_time_ms": elapsed_ms,
            },
        )

    verified = bool(record.get("verified", False))
    reported_scams = int(record.get("reported_scams", 0))

    return ToolExecutionResult(
        tool="sender_reputation",
        status="success",
        data={
            "verified": verified,
            "trusted": verified,
            "organization": record.get("organization"),
            "category": record.get("category"),
            "sender_type": record.get("sender_type"),
            "reported_scams": reported_scams,
            "confidence": float(record.get("confidence", 1.0 if verified else 0.6)),
            "lookup_value": sender_key,
            "matched_key": matched_key,
        },
        metadata={"execution_time_ms": elapsed_ms},
    )
