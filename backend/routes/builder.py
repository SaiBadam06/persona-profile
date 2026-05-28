import json
import uuid
from flask import Blueprint, request, Response, stream_with_context, jsonify

from ai.orchestrator import run_turn, polish

bp = Blueprint("builder", __name__, url_prefix="/api/builder")


SESSIONS: dict[str, dict] = {}


def _sse(event: str, data) -> str:
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


@bp.post("/turn")
def builder_turn():
    body = request.get_json(force=True, silent=True) or {}
    session_id = body.get("session_id") or str(uuid.uuid4())
    last_answer = body.get("last_answer")
    incoming_state = body.get("state") or "ask_purpose"
    persona_so_far = body.get("persona_so_far") or SESSIONS.get(session_id, {}).get("persona", {})

    @stream_with_context
    def gen():
        try:
            yield _sse("session", {"session_id": session_id})
            response = run_turn(incoming_state, persona_so_far, last_answer)

            merged = _deep_merge(persona_so_far, response.persona_delta or {})
            SESSIONS[session_id] = {"persona": merged, "state": response.next_state}

            yield _sse("delta", response.persona_delta or {})
            yield f"event: message\ndata: {response.ai_message}\n\n"
            if response.next_question:
                yield _sse("question", response.next_question.model_dump())
            yield _sse("state", {"next_state": response.next_state})

            if response.next_state == "done":
                final = polish(merged)
                SESSIONS[session_id]["persona"] = final
                yield _sse("final", final)
        except Exception as e:
            yield _sse("error", {"message": str(e)})

    return Response(gen(), mimetype="text/event-stream")


@bp.get("/session/<session_id>")
def get_session(session_id: str):
    sess = SESSIONS.get(session_id)
    if not sess:
        return jsonify(error="not_found"), 404
    return jsonify(sess), 200


def _deep_merge(a: dict, b: dict) -> dict:
    out = dict(a)
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        elif isinstance(v, list):
            out[k] = v
        else:
            out[k] = v
    return out
