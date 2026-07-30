from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AnalysisPayload(BaseModel):
    classification: str | None = None
    risk_score: int | None = None
    severity: str | None = None
    confidence: float | None = None
    summary: str | None = None
    recommended_action: str | None = None


class ContributorPayload(BaseModel):
    source: str
    indicator: str
    weight: int


class EvidenceItemPayload(BaseModel):
    tool: str
    result: str


class EvidencePayload(BaseModel):
    indicators: list[str] = Field(default_factory=list)
    contributors: list[ContributorPayload] = Field(default_factory=list)
    items: list[EvidenceItemPayload] = Field(default_factory=list)


class SMSPayload(BaseModel):
    sender: str | None = None
    message: str | None = None
    timestamp: str | None = None


class PlannerPayload(BaseModel):
    selected_tools: list[str] = Field(default_factory=list)
    reason: str | None = None
    confidence: float | None = None


class ToolTracePayload(BaseModel):
    tool: str
    status: str
    data: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class InvestigationTracePayload(BaseModel):
    reasoning: str | None = None


class MetadataPayload(BaseModel):
    analysis_id: str | None = None
    timestamp: str | None = None
    execution_time_ms: int | None = None
    tools_used: list[str] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    agent: str = "sms_agent"
    version: str = "1.0.0"
    status: str = "success"
    error: str | None = None
    sms: SMSPayload
    analysis: AnalysisPayload
    planner: PlannerPayload
    investigation: InvestigationTracePayload
    tool_results: list[ToolTracePayload] = Field(default_factory=list)
    social_engineering: list[str] = Field(default_factory=list)
    evidence: EvidencePayload
    metadata: MetadataPayload


class ErrorPayload(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    status: str = "error"
    error: ErrorPayload

