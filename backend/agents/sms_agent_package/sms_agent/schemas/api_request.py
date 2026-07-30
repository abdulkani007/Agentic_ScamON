from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class SMSAnalysisRequest(BaseModel):
    sender: str | None = Field(default=None, max_length=100)
    message: str | None = Field(default=None, min_length=1, max_length=5000)
    timestamp: datetime | str | None = None
    sms: str | None = Field(default=None, min_length=1, max_length=5000)

    @model_validator(mode="after")
    def validate_payload(self) -> "SMSAnalysisRequest":
        body = self.message or self.sms
        if body is None or not body.strip():
            raise ValueError("SMS must not be empty.")

        if self.sender is not None and not self.sender.strip():
            raise ValueError("Sender must not be empty.")

        return self

    def to_raw_sms(self) -> str:
        body = (self.message or self.sms or "").strip()
        sender = self.sender.strip() if self.sender else None

        if sender:
            return f"Sender: {sender}\n{body}"
        return body

    def normalized_timestamp(self) -> str | None:
        if self.timestamp is None:
            return None
        if isinstance(self.timestamp, datetime):
            return self.timestamp.isoformat()
        return self.timestamp

