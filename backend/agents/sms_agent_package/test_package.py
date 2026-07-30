from __future__ import annotations

import json

from sms_agent import SMSAgent
from sms_agent.schemas import PlannerDecision
from sms_agent.services.investigator import Investigator
from sms_agent.services.planner import Planner


class FakeLLMClient:
    def __init__(self, response: str) -> None:
        self.response = response

    def generate(self, prompt: str) -> str:
        return self.response


class DemoPlanner(Planner):
    def plan(self, state):  # noqa: ANN001
        required_tools = []
        if state.extracted_features.organization:
            required_tools.append("organization_verification")
        if state.extracted_features.sender_id:
            required_tools.append("sender_reputation")
        if state.extracted_features.urls:
            required_tools.append("website_verification")

        return PlannerDecision(
            required_tools=required_tools,
            reason="Demo planner selected core tools.",
            confidence=0.9,
        )


def main() -> None:
    fake_investigator = Investigator(
        client=FakeLLMClient(
            json.dumps(
                {
                    "classification": "Bank Phishing",
                    "confidence": 0.96,
                    "reasoning": "The message impersonates SBI and uses a suspicious URL.",
                    "indicators": ["Bank Impersonation", "Suspicious Domain"],
                    "social_engineering": ["Authority", "Urgency"],
                    "summary": "Likely phishing SMS impersonating SBI.",
                }
            )
        )
    )
    agent = SMSAgent(planner=DemoPlanner(), investigator=fake_investigator)
    result = agent.analyze(
        sender="VM-SBI",
        message="Your account is blocked. Visit https://sbi-login.xyz",
        timestamp="2026-07-29T10:30:00+05:30",
    )
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
