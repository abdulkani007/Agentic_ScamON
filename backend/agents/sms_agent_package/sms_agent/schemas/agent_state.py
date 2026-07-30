from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


class SenderFeatures(BaseModel):
    raw: str | None = None
    type: str | None = None
    prefix: str | None = None
    identifier: str | None = None


class OrganizationMatch(BaseModel):
    name: str | None = None
    canonical_name: str | None = None
    confidence: float | None = None


class URLFeatures(BaseModel):
    url: str
    domain: str | None = None
    path: str | None = None
    protocol: str | None = None
    is_shortened: bool = False


class EntityFeatures(BaseModel):
    amounts: list[str] = Field(default_factory=list)
    emails: list[str] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)
    upi_ids: list[str] = Field(default_factory=list)


class KeywordCategories(BaseModel):
    security: list[str] = Field(default_factory=list)
    payment: list[str] = Field(default_factory=list)
    urgency: list[str] = Field(default_factory=list)
    general: list[str] = Field(default_factory=list)


class ExtractedFeatures(BaseModel):
    model_config = ConfigDict(validate_assignment=True)

    sender: SenderFeatures = Field(default_factory=SenderFeatures)
    organizations: list[OrganizationMatch] = Field(default_factory=list)
    urls: list[URLFeatures] = Field(default_factory=list)
    intents: list[str] = Field(default_factory=list)
    entities: EntityFeatures = Field(default_factory=EntityFeatures)
    keyword_categories: KeywordCategories = Field(default_factory=KeywordCategories)
    language: str | None = None

    @field_validator("urls", mode="before")
    @classmethod
    def coerce_legacy_urls(cls, value: Any) -> Any:
        if not isinstance(value, list):
            return value

        normalized_urls: list[Any] = []
        for item in value:
            if isinstance(item, str):
                parsed = urlparse(item)
                normalized_urls.append(
                    {
                        "url": item,
                        "domain": parsed.netloc.lower() or None,
                        "path": (parsed.path or "/") if parsed.netloc else (parsed.path or None),
                        "protocol": parsed.scheme.lower() or None,
                        "is_shortened": parsed.netloc.lower() in {
                            "bit.ly",
                            "tinyurl.com",
                            "goo.gl",
                            "t.co",
                            "ow.ly",
                            "rb.gy",
                        },
                    }
                )
            else:
                normalized_urls.append(item)
        return normalized_urls

    @computed_field
    @property
    def sender_id(self) -> str | None:
        return self.sender.identifier or self.sender.raw

    @sender_id.setter
    def sender_id(self, value: str | None) -> None:
        self.sender.raw = value
        self.sender.identifier = value

    @computed_field
    @property
    def phone_number(self) -> str | None:
        return self.entities.phones[0] if self.entities.phones else None

    @computed_field
    @property
    def organization(self) -> str | None:
        if not self.organizations:
            return None

        primary = self.organizations[0]
        return primary.canonical_name or primary.name

    @organization.setter
    def organization(self, value: str | None) -> None:
        if value is None:
            self.organizations = []
            return

        self.organizations = [
            OrganizationMatch(
                name=value,
                canonical_name=value,
                confidence=1.0,
            )
        ]

    @computed_field
    @property
    def keywords(self) -> list[str]:
        ordered_keywords: list[str] = []

        for values in (
            self.keyword_categories.security,
            self.keyword_categories.payment,
            self.keyword_categories.urgency,
            self.keyword_categories.general,
        ):
            for value in values:
                if value not in ordered_keywords:
                    ordered_keywords.append(value)

        return ordered_keywords


class PlannerDecision(BaseModel):
    required_tools: list[str] = Field(default_factory=list)
    reason: str | None = None
    confidence: float | None = None


class ToolExecutionResult(BaseModel):
    tool: str
    status: str = "pending"
    data: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class InvestigationResult(BaseModel):
    classification: str | None = None
    confidence: float | None = None
    reasoning: str | None = None
    indicators: list[str] = Field(default_factory=list)
    social_engineering: list[str] = Field(default_factory=list)
    summary: str | None = None


class FinalReport(BaseModel):
    agent: str = "SMS_Agent"
    classification: str | None = None
    risk_score: int | None = None
    severity: str | None = None
    confidence: float | None = None
    indicators: list[str] = Field(default_factory=list)
    contributors: list[dict[str, Any]] = Field(default_factory=list)
    entities: dict[str, Any] = Field(default_factory=dict)
    summary: str | None = None


class AgentState(BaseModel):
    raw_sms: str
    source_timestamp: str | None = None
    normalized_sms: str | None = None
    extracted_features: ExtractedFeatures = Field(default_factory=ExtractedFeatures)
    planner_decision: PlannerDecision = Field(default_factory=PlannerDecision)
    tool_results: dict[str, ToolExecutionResult] = Field(default_factory=dict)
    evidence: dict[str, Any] = Field(default_factory=dict)
    investigation_result: InvestigationResult = Field(default_factory=InvestigationResult)
    final_report: FinalReport = Field(default_factory=FinalReport)
