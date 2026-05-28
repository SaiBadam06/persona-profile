from ai.schemas import Persona, BuilderTurnResponse


SAMPLE_PERSONA = {
    "id": "p1",
    "slug": "jane-doe",
    "owner_user_id": "u1",
    "owner_display_name": "Jane Doe",
    "meta": {"purpose": "portfolio", "style": "futuristic", "palette": "neon", "layout_kind": "bento"},
    "hero": {"headline": "AI researcher", "subheadline": "Building x.", "cta_label": "Chat", "ai_chat_position": "hero"},
    "sections": [
        {"type": "about", "priority": 1, "content": {"body": "Hi."}},
        {"type": "projects", "priority": 2, "content": {"items": [{"title": "P", "description": "D"}]}},
    ],
    "theme": {"primary_color": "#8b5cf6", "accent_color": "#22d3ee", "mode": "dark", "particle_density": "subtle"},
    "generated_at": "2026-05-28T00:00:00Z",
    "version": 1,
}


def test_persona_round_trip():
    p = Persona.model_validate(SAMPLE_PERSONA)
    assert p.slug == "jane-doe"
    dumped = p.model_dump()
    assert dumped["meta"]["layout_kind"] == "bento"


def test_builder_turn_response_minimal():
    r = BuilderTurnResponse(next_state="done", ai_message="All set.")
    assert r.persona_delta == {}
