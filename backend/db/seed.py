import json
from datetime import datetime

from db.models import init_db, get_session, User, Persona


SEED_SLUG = "sai-deekshith-badam-2"

SEED_PERSONA = {
    "id": "seed-persona-1",
    "slug": SEED_SLUG,
    "owner_user_id": "seed-user-1",
    "owner_display_name": "Sai Deekshith Badam",
    "meta": {
        "purpose": "ai-researcher",
        "style": "futuristic",
        "palette": "neon",
        "layout_kind": "bento",
    },
    "hero": {
        "headline": "AI researcher building agentic systems.",
        "subheadline": "I design how AI thinks, plans, and talks back.",
        "cta_label": "Chat with my persona",
        "ai_chat_position": "hero",
    },
    "sections": [
        {
            "type": "about",
            "priority": 1,
            "content": {
                "body": "I work at the intersection of agentic AI and human-centered product design. Currently exploring conversational systems that adapt to the person on the other side of the screen.",
            },
        },
        {
            "type": "projects",
            "priority": 2,
            "content": {
                "items": [
                    {
                        "title": "PersonaOn",
                        "description": "AI that generates a personalized public persona from a short conversation.",
                        "tags": ["AI", "Next.js", "Groq"],
                    },
                    {
                        "title": "Agentic Workflows",
                        "description": "Research on multi-step LLM planners that recover from their own mistakes.",
                        "tags": ["Research", "LLM"],
                    },
                ]
            },
        },
        {
            "type": "skills",
            "priority": 3,
            "content": {
                "groups": [
                    {"label": "AI / ML", "items": ["LLM orchestration", "RAG", "Agentic systems", "Prompt engineering"]},
                    {"label": "Engineering", "items": ["TypeScript", "Python", "Flask", "Next.js"]},
                ]
            },
        },
        {
            "type": "experience",
            "priority": 4,
            "content": {
                "items": [
                    {"role": "Founder", "organization": "PersonaOn", "start": "2024", "end": None,
                     "summary": "Building an AI-native persona platform."},
                ]
            },
        },
        {
            "type": "links",
            "priority": 5,
            "content": {
                "items": [
                    {"label": "GitHub", "url": "https://github.com/", "icon": "github"},
                    {"label": "LinkedIn", "url": "https://linkedin.com/", "icon": "linkedin"},
                    {"label": "Website", "url": "https://personaon.com", "icon": "website"},
                ]
            },
        },
    ],
    "theme": {
        "primary_color": "#8b5cf6",
        "accent_color": "#22d3ee",
        "mode": "dark",
        "particle_density": "subtle",
    },
    "generated_at": datetime.utcnow().isoformat() + "Z",
    "version": 1,
}


def seed():
    init_db()
    s = get_session()
    try:
        existing = s.query(Persona).filter_by(slug=SEED_SLUG).first()
        if existing:
            return
        user = s.query(User).filter_by(id="seed-user-1").first()
        if not user:
            user = User(id="seed-user-1")
            s.add(user)
        p = Persona(
            id=SEED_PERSONA["id"],
            slug=SEED_SLUG,
            owner_user_id="seed-user-1",
            data=json.dumps(SEED_PERSONA),
            version=1,
        )
        s.add(p)
        s.commit()
    finally:
        s.close()


if __name__ == "__main__":
    seed()
    print(f"Seeded persona '{SEED_SLUG}'.")
