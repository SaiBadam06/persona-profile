from __future__ import annotations
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from pydantic import ValidationError

from ai.groq_client import complete_json, BUILDER_MODEL
from ai.schemas import BuilderTurnResponse, Persona


STATES = [
    "ask_purpose",
    "ask_highlight",
    "ask_style",
    "ask_palette",
    "ask_ai_chat",
    "ask_visitor_actions",
    "ask_priority",
    "ask_identity",
    "done",
]


PROMPTS_DIR = Path(__file__).parent / "prompts"


def next_state(current: str) -> str:
    if current not in STATES:
        return STATES[0]
    idx = STATES.index(current)
    return STATES[min(idx + 1, len(STATES) - 1)]


def load_prompt(name: str) -> str:
    path = PROMPTS_DIR / name
    return path.read_text(encoding="utf-8")


def build_user_payload(persona_so_far: dict, last_answer: Optional[str], current_state: str) -> str:
    return json.dumps({
        "current_state": current_state,
        "last_answer": last_answer,
        "persona_so_far": persona_so_far,
    }, ensure_ascii=False)


def run_turn(
    current_state: str,
    persona_so_far: dict,
    last_answer: Optional[str],
) -> BuilderTurnResponse:
    """Drive one builder FSM turn via Groq. Returns a validated BuilderTurnResponse."""
    if current_state == "done":
        return BuilderTurnResponse(next_state="done", ai_message="Your persona is ready.")

    state_prompt = load_prompt(f"builder_states/{current_state}.txt")
    system = load_prompt("builder_system.txt") + "\n\n" + state_prompt
    user = build_user_payload(persona_so_far, last_answer, current_state)

    raw = complete_json(system=system, user=user, model=BUILDER_MODEL)
    try:
        return BuilderTurnResponse.model_validate(raw)
    except ValidationError as e:
        retry_user = user + f"\n\nPrevious response failed validation: {e}. Return valid JSON matching the schema."
        raw2 = complete_json(system=system, user=retry_user, model=BUILDER_MODEL)
        return BuilderTurnResponse.model_validate(raw2)


def polish(persona_draft: dict) -> dict:
    """Final pass — polish copy and ensure schema compliance."""
    system = load_prompt("polish.txt")
    user = json.dumps({"draft": persona_draft}, ensure_ascii=False)
    raw = complete_json(system=system, user=user, model=BUILDER_MODEL)
    raw.setdefault("id", str(uuid.uuid4()))
    raw.setdefault("owner_user_id", persona_draft.get("owner_user_id", "anon"))
    raw.setdefault("generated_at", datetime.utcnow().isoformat() + "Z")
    raw.setdefault("version", 1)
    return Persona.model_validate(raw).model_dump()
