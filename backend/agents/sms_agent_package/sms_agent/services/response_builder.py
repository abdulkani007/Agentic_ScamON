from __future__ import annotations

from ..schemas import (
    AgentState,
    AnalysisPayload,
    AnalysisResponse,
    ContributorPayload,
    ErrorPayload,
    ErrorResponse,
    EvidencePayload,
    EvidenceItemPayload,
    InvestigationTracePayload,
    MetadataPayload,
    PlannerPayload,
    SMSPayload,
    ToolTracePayload,
)


class ResponseBuilder:
    @staticmethod
    def _recommended_action(state: AgentState) -> str:
        classification = (state.final_report.classification or "").strip().lower()
        if "phishing" in classification or "scam" in classification:
            return "Do not click links, do not share OTPs, and block or report the sender."
        if classification == "legitimate banking alert":
            return "Proceed only through the official app or website if action is required."
        if classification == "uncertain":
            return "Treat cautiously and verify the sender through official channels."
        return "Review the message carefully before taking any action."

    def build_success_response(self, state: AgentState) -> AnalysisResponse:
        contributors = [
            ContributorPayload(
                source=str(contributor["source"]),
                indicator=str(contributor["indicator"]),
                weight=int(contributor["weight"]),
            )
            for contributor in state.final_report.contributors
        ]
        tool_results = [
            ToolTracePayload(
                tool=tool_name,
                status=result.status,
                data=dict(result.data),
                metadata=dict(result.metadata),
            )
            for tool_name, result in state.tool_results.items()
        ]
        evidence_items = [
            EvidenceItemPayload(
                tool=str(contributor["source"]),
                result=str(contributor["indicator"]),
            )
            for contributor in state.final_report.contributors
        ]
        tools_used = [
            tool_name
            for tool_name, result in state.tool_results.items()
            if result.status == "success"
        ]
        execution_time_ms = sum(
            int(result.metadata.get("execution_time_ms", 0) or 0)
            for result in state.tool_results.values()
        )

        return AnalysisResponse(
            agent="sms_agent",
            version="1.0.0",
            status="success",
            error=None,
            sms=SMSPayload(
                sender=state.evidence.get("sms", {}).get("sender"),
                message=state.evidence.get("sms", {}).get("raw_text"),
                timestamp=state.evidence.get("case", {}).get("source_timestamp")
                or state.evidence.get("case", {}).get("timestamp"),
            ),
            analysis=AnalysisPayload(
                classification=state.final_report.classification,
                risk_score=state.final_report.risk_score,
                severity=state.final_report.severity,
                confidence=state.final_report.confidence,
                summary=state.final_report.summary,
                recommended_action=self._recommended_action(state),
            ),
            planner=PlannerPayload(
                selected_tools=list(state.planner_decision.required_tools),
                reason=state.planner_decision.reason,
                confidence=state.planner_decision.confidence,
            ),
            investigation=InvestigationTracePayload(
                reasoning=state.investigation_result.reasoning,
            ),
            tool_results=tool_results,
            social_engineering=list(state.investigation_result.social_engineering),
            evidence=EvidencePayload(
                indicators=list(state.final_report.indicators),
                contributors=contributors,
                items=evidence_items,
            ),
            metadata=MetadataPayload(
                analysis_id=state.evidence.get("case", {}).get("analysis_id"),
                timestamp=state.evidence.get("case", {}).get("timestamp"),
                execution_time_ms=execution_time_ms or None,
                tools_used=tools_used,
            ),
        )

    def build_error_response(self, code: str, message: str) -> ErrorResponse:
        return ErrorResponse(
            error=ErrorPayload(
                code=code,
                message=message,
            )
        )
