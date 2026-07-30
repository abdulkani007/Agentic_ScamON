from __future__ import annotations

import json
from pathlib import Path

from pydantic import ValidationError

from ..schemas import AgentState, InvestigationResult
from .llm import GroqLLMClient, LLMClient

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "investigation_prompt.txt"


def load_investigation_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


class Investigator:
    def __init__(self, client: LLMClient | None = None) -> None:
        self.client = client or GroqLLMClient()
        self.prompt_template = load_investigation_prompt()

    def investigate(self, state: AgentState) -> AgentState:
        prompt = self.prompt_template.replace(
            "__EVIDENCE_JSON__",
            json.dumps(state.evidence, indent=2, ensure_ascii=True),
        )
        raw_response = self.client.generate(prompt)
        state.investigation_result = parse_investigation_response(raw_response)
        return state


def parse_investigation_response(raw_response: str) -> InvestigationResult:
    fallback = InvestigationResult(
        classification="Uncertain",
        confidence=0.0,
        reasoning="The investigator returned an invalid response that could not be parsed safely.",
        indicators=[],
        social_engineering=[],
        summary="Investigation result unavailable due to invalid model output.",
    )

    try:
        parsed = json.loads(raw_response)
    except json.JSONDecodeError:
        return fallback

    try:
        result = InvestigationResult.model_validate(parsed)
    except ValidationError:
        return fallback

    if result.classification is None or result.reasoning is None or result.summary is None:
        return fallback

    return result
