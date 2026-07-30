from __future__ import annotations

import os
from abc import ABC, abstractmethod

from ...core.config import settings


class LLMClient(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Return raw model output for the supplied prompt."""


class GroqLLMClient(LLMClient):
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or settings.groq_model

    def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured.")

        try:
            from groq import Groq
        except ImportError as exc:
            raise ImportError("The groq package is required for LLM investigation.") from exc

        client = Groq(api_key=self.api_key)
        response = client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            temperature=0.2,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
        return response.choices[0].message.content or "{}"
