import json
import re
import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request

from db.models import get_session, Persona, User
from ai.schemas import Persona as PersonaSchema

bp = Blueprint("persona", __name__, url_prefix="/api/personas")


def _slugify(value: str) -> str:
    v = re.sub(r"[^a-z0-9\s-]", "", value.lower()).strip()
    v = re.sub(r"\s+", "-", v)
    v = re.sub(r"-+", "-", v)
    return v.strip("-") or "persona"


@bp.get("/<slug>")
def get_persona(slug: str):
    s = get_session()
    try:
        p = s.query(Persona).filter_by(slug=slug).first()
        if not p:
            return jsonify(error="not_found"), 404
        return jsonify(p.to_dict()), 200
    finally:
        s.close()


@bp.post("")
def create_persona():
    body = request.get_json(force=True, silent=True) or {}
    user_id = request.headers.get("X-User-Id") or body.get("owner_user_id") or str(uuid.uuid4())

    body.setdefault("id", str(uuid.uuid4()))
    body.setdefault("owner_user_id", user_id)
    body.setdefault("generated_at", datetime.utcnow().isoformat() + "Z")
    body.setdefault("version", 1)
    if not body.get("slug"):
        body["slug"] = _slugify(body.get("owner_display_name") or "persona")

    persona = PersonaSchema.model_validate(body).model_dump()

    s = get_session()
    try:
        u = s.query(User).filter_by(id=user_id).first()
        if not u:
            u = User(id=user_id)
            s.add(u)

        base_slug = persona["slug"]
        slug = base_slug
        n = 2
        while s.query(Persona).filter_by(slug=slug).first() is not None:
            slug = f"{base_slug}-{n}"
            n += 1
        persona["slug"] = slug

        row = Persona(
            id=persona["id"],
            slug=slug,
            owner_user_id=user_id,
            data=json.dumps(persona),
            version=persona["version"],
        )
        s.add(row)
        s.commit()
        return jsonify(persona), 201
    except Exception as e:
        s.rollback()
        return jsonify(error="create_failed", detail=str(e)), 400
    finally:
        s.close()
