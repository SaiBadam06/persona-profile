import json
from flask import Blueprint, request, Response, stream_with_context, jsonify

from db.models import get_session, Persona
from ai.groq_client import stream_tokens
from ai.orchestrator import load_prompt

bp = Blueprint("persona_chat", __name__, url_prefix="/api/personas")


def _sse(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


@bp.post("/<slug>/chat")
def persona_chat(slug: str):
    s = get_session()
    try:
        p = s.query(Persona).filter_by(slug=slug).first()
        if not p:
            return jsonify(error="not_found"), 404
        persona_json = p.to_dict()
    finally:
        s.close()

    body = request.get_json(force=True, silent=True) or {}
    user_message = (body.get("message") or "").strip()
    if not user_message:
        return jsonify(error="empty_message"), 400

    template = load_prompt("persona_chat.txt")
    system = (template
              .replace("{{owner_display_name}}", persona_json.get("owner_display_name", ""))
              .replace("{{persona_json}}", json.dumps(persona_json, ensure_ascii=False)))

    @stream_with_context
    def gen():
        try:
            for tok in stream_tokens(system=system, user=user_message):
                yield _sse("token", tok)
            yield _sse("done", "1")
        except Exception as e:
            yield _sse("error", str(e))

    return Response(gen(), mimetype="text/event-stream")
