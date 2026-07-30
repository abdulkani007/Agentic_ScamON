from __future__ import annotations

import json
from pathlib import Path
from abc import ABC, abstractmethod

from typing import Optional

from ..schemas import AgentState, PlannerDecision
from .llm import GroqLLMClient, LLMClient
from .tool_registry import ALLOWED_TOOLS

PLANNER_PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "planner_prompt.txt"


class Planner(ABC):
    @abstractmethod
    def plan(self, state: AgentState) -> PlannerDecision:
        """Return a planner decision for the given agent state."""


class RuleBasedPlanner(Planner):
    def plan(self, state: AgentState) -> PlannerDecision:
        required_tools: list[str] = []
        reasons: list[str] = []
        urls = state.extracted_features.urls
        organization = state.extracted_features.organization
        sender_id = state.extracted_features.sender_id

        if organization:
            required_tools.append("organization_verification")
            reasons.append("Organization detected in SMS.")

        if sender_id:
            required_tools.append("sender_reputation")
            reasons.append("Sender information is present in SMS.")

        if urls:
            required_tools.append("website_verification")
            reasons.append("URL present in SMS.")

        if not required_tools:
            reasons.append("No additional tool evidence is needed from the extracted features.")

        return PlannerDecision(
            required_tools=required_tools,
            reason=" ".join(reasons),
            confidence=0.55 if required_tools else 0.92,
        )


def load_planner_prompt() -> str:
    return PLANNER_PROMPT_PATH.read_text(encoding="utf-8")


def build_planner_features_payload(state: AgentState) -> dict:
    return {
        "sender": state.extracted_features.sender.model_dump(),
        "organizations": [organization.model_dump() for organization in state.extracted_features.organizations],
        "urls": [url.model_dump() for url in state.extracted_features.urls],
        "intents": list(state.extracted_features.intents),
        "entities": state.extracted_features.entities.model_dump(),
        "keyword_categories": state.extracted_features.keyword_categories.model_dump(),
        "language": state.extracted_features.language,
    }


def parse_planner_response(raw_response: str) -> Optional[PlannerDecision]:
    try:
        parsed = json.loads(raw_response)
    except json.JSONDecodeError:
        return None

    required_tools = parsed.get("required_tools")
    reason = parsed.get("reason")
    confidence = parsed.get("confidence")

    if not isinstance(required_tools, list):
        return None

    validated_tools = [
        tool_name
        for tool_name in required_tools
        if isinstance(tool_name, str) and tool_name in ALLOWED_TOOLS
    ]

    if confidence is not None and not isinstance(confidence, (int, float)):
        confidence = None

    return PlannerDecision(
        required_tools=validated_tools,
        reason=reason if isinstance(reason, str) else None,
        confidence=float(confidence) if confidence is not None else None,
    )


class LLMPlanner(Planner):
    def __init__(
        self,
        client: LLMClient | None = None,
        fallback_planner: Planner | None = None,
    ) -> None:
        self.client = client or GroqLLMClient()
        self.fallback_planner = fallback_planner or RuleBasedPlanner()
        self.prompt_template = load_planner_prompt()

    def plan(self, state: AgentState) -> PlannerDecision:
        try:
            payload = json.dumps(build_planner_features_payload(state), ensure_ascii=True)
            prompt = self.prompt_template.replace("__FEATURES_JSON__", payload)
            raw_response = self.client.generate(prompt)
            decision = parse_planner_response(raw_response)
            if decision is not None:
                return decision
        except Exception:
            pass

        return self.fallback_planner.plan(state)


def validate_planner_decision(decision: PlannerDecision) -> PlannerDecision:
    valid_tools: list[str] = []

    for tool_name in decision.required_tools:
        if tool_name in ALLOWED_TOOLS and tool_name not in valid_tools:
            valid_tools.append(tool_name)

    reason = decision.reason or "Planner decision validated."

    return PlannerDecision(
        required_tools=valid_tools,
        reason=reason,
        confidence=decision.confidence,
    )
