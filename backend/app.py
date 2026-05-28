from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db.seed import seed as seed_db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    seed_db()

    from routes.persona import bp as persona_bp
    app.register_blueprint(persona_bp)

    @app.get("/healthz")
    def healthz():
        return jsonify(status="ok"), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=Config.DEBUG)
