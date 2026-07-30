from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class EmailConnectResponse(BaseModel):
    connected: bool = Field(..., description="Whether Gmail is currently connected.")
    auth_url: Optional[str] = Field(None, description="Google OAuth authorization URL if not connected.")
    email_address: Optional[str] = Field(None, description="The connected user's email address.")

class EmailFetchRequest(BaseModel):
    filter_type: str = Field(default="inbox", description="Filter type: inbox, unread, or all.")
    limit: int = Field(default=10, description="Maximum number of messages to fetch.")

class EmailSummary(BaseModel):
    id: str = Field(..., description="Gmail Message ID.")
    threadId: str = Field(..., description="Gmail Thread ID.")
    subject: str = Field(..., description="Email subject.")
    sender: str = Field(..., description="Sender name and email.")
    receiver: str = Field(..., description="Receiver email.")
    date: str = Field(..., description="Received timestamp.")
    snippet: str = Field(..., description="Brief snippet text of the body.")
    is_unread: bool = Field(..., description="Whether the email is unread.")

class AttachmentInfo(BaseModel):
    id: str = Field(..., description="Gmail Attachment ID.")
    filename: str = Field(..., description="Filename.")
    mime_type: str = Field(..., description="MIME type.")
    size_bytes: int = Field(..., description="Attachment size in bytes.")

class EmailDetails(BaseModel):
    id: str = Field(..., description="Message ID.")
    subject: str = Field(..., description="Email subject.")
    sender: str = Field(..., description="Sender details.")
    receiver: str = Field(..., description="Receiver details.")
    date: str = Field(..., description="Date header value.")
    snippet: str = Field(..., description="Email body snippet.")
    body_text: str = Field(..., description="Plain text body.")
    body_html: str = Field(..., description="HTML body if available.")
    headers: Dict[str, str] = Field(..., description="Parsed key-value headers.")
    attachments: List[AttachmentInfo] = Field(default=[], description="List of attachment metadata.")

class EmailAnalysisRequest(BaseModel):
    message_id: str = Field(..., description="Message ID to retrieve and analyze.")

class HeaderAnalysisInfo(BaseModel):
    spf: str = Field(..., description="SPF verification verdict (pass, fail, neutral, none).")
    dkim: str = Field(..., description="DKIM verification verdict (pass, fail, none).")
    dmarc: str = Field(..., description="DMARC verification verdict (pass, fail, none).")
    return_path: str = Field(..., description="Return-path address.")
    reply_to: str = Field(..., description="Reply-to address.")
    message_id: str = Field(..., description="Message-ID header.")
    received_hops: int = Field(..., description="Count of routing hops.")
    spf_reason: str = Field(default="", description="Reason for SPF status.")
    dkim_reason: str = Field(default="", description="Reason for DKIM status.")
    dmarc_reason: str = Field(default="", description="Reason for DMARC status.")
    mismatch_from_return_path: bool = Field(..., description="True if From domain != Return-Path domain.")
    mismatch_from_reply_to: bool = Field(..., description="True if From domain != Reply-To domain.")
    suspicious_headers: List[str] = Field(default=[], description="List of suspicious custom header names/values.")
    risk_score: int = Field(..., description="Header alignment and security risk score (0-100).")

class LinkAnalysisInfo(BaseModel):
    url: str = Field(..., description="Extracted URL.")
    domain: str = Field(..., description="Normalized domain name.")
    risk_score: int = Field(..., description="Existing Website Agent risk score (0-100).")
    decision: str = Field(..., description="Decision from Website Agent (SAFE, SUSPICIOUS, HIGH RISK).")
    reason: str = Field(..., description="Reputation and analysis reasoning.")

class AttachmentAnalysisInfo(BaseModel):
    filename: str = Field(..., description="Filename.")
    extension: str = Field(..., description="File extension.")
    mime_type: str = Field(..., description="MIME type.")
    size_bytes: int = Field(..., description="File size.")
    suspicious: bool = Field(..., description="True if dangerous/executable/macro format.")
    risk_score: int = Field(..., description="Attachment hazard risk score (0-100).")
    reason: str = Field(..., description="Detailed extension security warnings.")

class DomainReputationInfo(BaseModel):
    domain: str = Field(..., description="Sender domain.")
    age_days: int = Field(..., description="Domain age in days.")
    registrar: str = Field(..., description="Registrar organization.")
    valid_ssl: bool = Field(..., description="True if domain has valid SSL certificate.")
    ssl_issuer: str = Field(..., description="SSL certificate issuer.")
    has_mx_records: bool = Field(..., description="True if domain has active mail exchanger records.")
    reputation_score: int = Field(..., description="Domain reputation risk score (0-100).")

class EmailAnalysisResult(BaseModel):
    message_id: str = Field(..., description="Gmail message ID.")
    subject: str = Field(..., description="Email subject.")
    sender: str = Field(..., description="Sender address.")
    receiver: str = Field(..., description="Receiver address.")
    date: str = Field(..., description="Date header.")
    snippet: str = Field(..., description="Email snippet.")
    headers_analysis: HeaderAnalysisInfo = Field(..., description="Email header forensic metrics.")
    links_analysis: List[LinkAnalysisInfo] = Field(default=[], description="Extracted links reputation reports.")
    attachments_analysis: List[AttachmentAnalysisInfo] = Field(default=[], description="Attachment risk checks.")
    domain_reputation: DomainReputationInfo = Field(..., description="Sender domain reputation indicators.")
    llm_classification: str = Field(..., description="LLM classification (Phishing, BEC, Safe, etc.).")
    llm_reasoning: str = Field(..., description="Groq model explanatory logic.")
    risk_score: int = Field(..., description="Composite platform cybersecurity risk score (0-100).")
    threat_level: str = Field(..., description="Threat classification level (Safe, Low, Medium, High, Critical).")
