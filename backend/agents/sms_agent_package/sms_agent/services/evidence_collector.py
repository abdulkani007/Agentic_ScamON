from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from ..schemas import AgentState


def collect_evidence(state: AgentState) -> AgentState:
    state.evidence = {
        "case": {
            "analysis_id": str(uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_timestamp": state.source_timestamp,
        },
        "sms": {
            "raw_text": state.raw_sms,
            "normalized_text": state.normalized_sms,
            "sender": state.extracted_features.sender_id,
            "phone_number": state.extracted_features.phone_number,
            "organization": state.extracted_features.organization,
            "urls": [url.model_dump() for url in state.extracted_features.urls],
            "keywords": list(state.extracted_features.keywords),
            "intents": list(state.extracted_features.intents),
            "entities": state.extracted_features.entities.model_dump(),
            "keyword_categories": state.extracted_features.keyword_categories.model_dump(),
            "language": state.extracted_features.language,
        },
        "planner": {
            "requested_tools": list(state.planner_decision.required_tools),
            "reason": state.planner_decision.reason,
        },
        "tools": {
            tool_name: result.model_dump()
            for tool_name, result in state.tool_results.items()
        },
    }
    return state
