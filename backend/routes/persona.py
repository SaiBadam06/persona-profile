from flask import Blueprint, jsonify
from db.models import get_session, Persona

bp = Blueprint("persona", __name__, url_prefix="/api/personas")


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
