from __future__ import annotations
from typing import Literal, Optional, Union, List
from pydantic import BaseModel, Field


LayoutKind = Literal["bento", "single-column", "magazine", "minimal", "terminal"]
ChatPosition = Literal["hero", "floating", "sidebar", "embedded", "none"]
ParticleDensity = Literal["off", "subtle", "dense"]
Mode = Literal["dark", "light"]


class ExperienceItem(BaseModel):
    role: str
    organization: str
    start: str
    end: Optional[str] = None
    summary: Optional[str] = None


class ProjectItem(BaseModel):
    title: str
    description: str
    tags: List[str] = Field(default_factory=list)
    url: Optional[str] = None


class SkillGroup(BaseModel):
    label: str
    items: List[str]


class Testimonial(BaseModel):
    quote: str
    author: str
    role: Optional[str] = None


class LinkItem(BaseModel):
    label: str
    url: str
    icon: Optional[Literal["github", "linkedin", "x", "website", "email"]] = None


class AboutSection(BaseModel):
    type: Literal["about"]
    priority: int
    content: dict


class ExperienceSection(BaseModel):
    type: Literal["experience"]
    priority: int
    content: dict


class ProjectsSection(BaseModel):
    type: Literal["projects"]
    priority: int
    content: dict


class SkillsSection(BaseModel):
    type: Literal["skills"]
    priority: int
    content: dict


class TestimonialsSection(BaseModel):
    type: Literal["testimonials"]
    priority: int
    content: dict


class LinksSection(BaseModel):
    type: Literal["links"]
    priority: int
    content: dict


Section = Union[
    AboutSection, ExperienceSection, ProjectsSection,
    SkillsSection, TestimonialsSection, LinksSection,
]


class PersonaMeta(BaseModel):
    purpose: str
    style: str
    palette: str
    layout_kind: LayoutKind


class PersonaHero(BaseModel):
    headline: str
    subheadline: str
    cta_label: str
    ai_chat_position: ChatPosition


class PersonaTheme(BaseModel):
    primary_color: str
    accent_color: str
    mode: Mode
    particle_density: ParticleDensity


class Persona(BaseModel):
    id: str
    slug: str
    owner_user_id: str
    owner_display_name: str
    meta: PersonaMeta
    hero: PersonaHero
    sections: List[Section]
    theme: PersonaTheme
    generated_at: str
    version: int = 1


class QuestionOption(BaseModel):
    label: str
    value: str
    description: Optional[str] = None


class NextQuestion(BaseModel):
    header: str
    body: str
    kind: Literal["single", "multi", "text", "rank"]
    options: List[QuestionOption] = Field(default_factory=list)


class BuilderTurnResponse(BaseModel):
    next_state: str
    next_question: Optional[NextQuestion] = None
    persona_delta: dict = Field(default_factory=dict)
    ai_message: str
