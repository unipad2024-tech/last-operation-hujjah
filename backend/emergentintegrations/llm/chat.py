"""Local stub for emergentintegrations.llm.chat."""
from typing import List, Optional, Any


class FileContentWithMimeType:
    def __init__(self, file_path: str, mime_type: str):
        self.file_path = file_path
        self.mime_type = mime_type


class UserMessage:
    def __init__(self, text: str, file_contents: Optional[List[FileContentWithMimeType]] = None):
        self.text = text
        self.file_contents = file_contents or []


class LlmChat:
    def __init__(self, api_key: str, session_id: str = "", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self._provider = "anthropic"
        self._model = "claude-sonnet-4-6"

    def with_model(self, provider: str, model: str) -> "LlmChat":
        self._provider = provider
        self._model = model
        return self

    async def send_message(self, message: UserMessage) -> str:
        import httpx, json as _json

        if self._provider == "anthropic":
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            payload: dict[str, Any] = {
                "model": self._model,
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": message.text}],
            }
            if self.system_message:
                payload["system"] = self.system_message
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload,
                )
            if r.status_code != 200:
                raise RuntimeError(f"Anthropic error {r.status_code}: {r.text[:300]}")
            return r.json()["content"][0]["text"]

        elif self._provider == "gemini":
            parts: list[Any] = [{"text": message.text}]
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent?key={self.api_key}"
            payload = {"contents": [{"parts": parts}]}
            if self.system_message:
                payload["system_instruction"] = {"parts": [{"text": self.system_message}]}
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(url, json=payload)
            if r.status_code != 200:
                raise RuntimeError(f"Gemini error {r.status_code}: {r.text[:300]}")
            return r.json()["candidates"][0]["content"]["parts"][0]["text"]

        raise RuntimeError(f"Unknown provider: {self._provider}")
