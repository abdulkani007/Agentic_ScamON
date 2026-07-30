from __future__ import annotations

from .services.investigator import Investigator
from .services.planner import Planner
from .services.sms_pipeline import build_response, run_risk_engine_layer
from .schemas import AnalysisResponse


class SMSAgent:
    """Public wrapper around the SMS analysis pipeline."""

    def __init__(
        self,
        planner: Planner | None = None,
        investigator: Investigator | None = None,
    ) -> None:
        self.planner = planner
        self.investigator = investigator

    def analyze(
        self,
        sender: str,
        message: str,
        timestamp: str | None = None,
    ) -> AnalysisResponse:
        raw_sms = f"Sender: {sender}\n{message}" if sender else message
        state = run_risk_engine_layer(
            raw_sms,
            planner=self.planner,
            investigator=self.investigator,
            source_timestamp=timestamp,
        )
        return build_response(state)
