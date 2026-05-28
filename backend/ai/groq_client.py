from __future__ import annotations
import json
from typing import Generator, Optional
from groq import Groq
from config import Config


BUILDER_MODEL = "llama-3.3-70b-versatile"
CHAT_MODEL = "llama-3.1-8b-instant"


_client: Optional[Groq] = None


def client() -> Groq:
    global _client
    if _client is None:
        if not Config.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env.")
        _client = Groq(api_key=Config.GROQ_API_KEY)
    return _client


def complete_json(system: str, user: str, model: str = BUILDER_MODEL) -> dict:
    """One-shot JSON completion. Returns the parsed dict.

    Raises ValueError if Groq returns non-JSON content.
    """
    resp = client().chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.6,
    )
    content = resp.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Groq returned non-JSON: {content[:300]}") from e


def stream_tokens(system: str, user: str, model: str = CHAT_MODEL) -> Generator[str, None, None]:
    """Yield raw token strings from a streamed chat completion."""
    stream = client().chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        stream=True,
        temperature=0.7,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
