from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class EntityDetails(BaseModel):
    """Details of extracted entities from the call transcript."""

    phone_number: List[str] = Field(default_factory=list, alias="Phone Number")
    organization_name: List[str] = Field(
        default_factory=list, alias="Organization Name"
    )
    url: List[str] = Field(default_factory=list, alias="URL")
    email: List[str] = Field(default_factory=list, alias="Email")
    date: List[str] = Field(default_factory=list, alias="Date")
    time: List[str] = Field(default_factory=list, alias="Time")
    otp_number: List[str] = Field(default_factory=list, alias="OTP Number")

    model_config = {"populate_by_name": True, "by_alias": True}


class LLMAnalysisResult(BaseModel):
    """Result details returned by the LLM reasoning step (legacy support)."""

    urgency: str = Field(..., description="Level of urgency detected.")
    pressure: str = Field(..., description="Level of emotional pressure detected.")
    confidence: int = Field(..., description="Scam probability score from 0 to 100.")
    scam_type: str = Field(..., description="Type of scam category identified.")
    reasoning: str = Field(..., description="Analysis breakdown of the transcript.")


class AIReasoningDetails(BaseModel):
    summary: str = Field(..., description="Concise forensic summary.")
    threat_category: str = Field(..., description="forensic scam classification type.")
    confidence_rating: int = Field(..., description="Investigator confidence rating (0 to 100).")
    final_decision: str = Field(..., description="The classified decision status.")
    reasoning_steps: List[str] = Field(..., description="forensic indicator breakdown.")
    recommended_action: str = Field(..., description="Recommended Containment Strategy.")


class MemoryHistoryDetails(BaseModel):
    has_history: bool = Field(..., description="Whether caller history is present.")
    total_reports: int = Field(..., description="Total count of prior scam reports.")
    last_risk_score: Optional[int] = Field(None, description="Previous risk score recorded.")
    last_scam_type: Optional[str] = Field(None, description="Previous threat category recorded.")


class TimelineItem(BaseModel):
    step: str = Field(..., description="Description of the investigation workflow step.")
    status: str = Field(..., description="Status of the workflow step.")
    timestamp: str = Field(..., description="Execution completion timestamp.")


class CallAnalysisResponse(BaseModel):
    """Schema for the call analysis response."""

    agent_name: str = Field(
        default="Call Analysis Agent",
        description="The name of the agent generating the analysis.",
    )
    status: str = Field(
        default="success", description="Status of the call analysis operation."
    )
    risk_score: int = Field(
        ..., description="Calculated final scam risk score from 0 to 100."
    )
    confidence: int = Field(
        ..., description="Overall confidence level in the analysis."
    )
    transcript: str = Field(
        ...,
        description="The transcription of the call audio or the original transcript text.",
    )
    keywords: List[str] = Field(
        default_factory=list,
        description="List of security-sensitive keywords detected.",
    )
    entities: EntityDetails = Field(
        ..., description="Extracted entity details grouped by type."
    )
    llm_analysis: LLMAnalysisResult = Field(
        ..., description="Detailed LLM reasoning analysis."
    )
    recommendation: str = Field(
        ..., description="Actionable recommendation based on the scam risk score."
    )
    investigation_id: str = Field(..., description="Unique SOC UUID.")
    timestamp: str = Field(..., description="Forensic execution timestamp.")
    call_duration: int = Field(..., description="Audio length in seconds.")
    detected_language: str = Field(..., description="Whisper classification language.")
    speaker_count: int = Field(..., description="Number of unique voices detected.")
    emotion_timeline: Dict[str, int] = Field(..., description="Calculated pressure tactics scores.")
    ai_analysis: AIReasoningDetails = Field(..., description=" Groq LLM forensic analysis results.")
    memory_history: MemoryHistoryDetails = Field(..., description="Database match reports caller database.")
    timeline: List[TimelineItem] = Field(..., description="Step logs sequence.")
    mission_status: str = Field(..., description="The overall mission status.")

    model_config = {"populate_by_name": True, "by_alias": True}



