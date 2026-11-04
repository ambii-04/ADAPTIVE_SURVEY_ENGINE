from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from sqlalchemy import JSON, DateTime, func, UniqueConstraint

class ResearchProject(Base):
    __tablename__ = "research_projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    topic: Mapped[str] = mapped_column(String(300))
    target_audience: Mapped[str] = mapped_column(String(200))
    geography: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(50), default="created")
    research_plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    dimensions: Mapped[list["ResearchDimension"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

class ResearchDimension(Base):
    __tablename__ = "research_dimensions"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("research_projects.id")
    )
    name: Mapped[str] = mapped_column(String(200))
    importance: Mapped[float] = mapped_column(Float)
    target_coverage: Mapped[float] = mapped_column(Float)
    achieved_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    project: Mapped[ResearchProject] = relationship(back_populates="dimensions")

class SurveyRun(Base):
    __tablename__ = "survey_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("research_projects.id"))
    status: Mapped[str] = mapped_column(String(30), default="active")
    max_questions: Mapped[int] = mapped_column(default=10)
    created_at: Mapped[object] = mapped_column(
        DateTime, server_default=func.now()
    )
    survey_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    served_question_ids: Mapped[list[str]] = mapped_column(
        JSON, default=list, nullable=False
    )
    current_question_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    respondent_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    respondent_age: Mapped[int | None] = mapped_column(nullable=True)
    respondent_gender: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Gamified mini-game results: feature_challenge, sweetness_dial, usage_occasion.
    respondent_extras: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("survey_sessions.id"))
    question_id: Mapped[str] = mapped_column(String(50))
    option_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    answer_value: Mapped[object | None] = mapped_column(JSON, nullable=True)

class SessionDimensionCoverage(Base):
    __tablename__ = "session_dimension_coverage"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "dimension_id",
            name="uq_session_dimension_coverage",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("survey_sessions.id"),
        nullable=False,
    )

    dimension_id: Mapped[int] = mapped_column(
        ForeignKey("research_dimensions.id"),
        nullable=False,
    )

    achieved_coverage: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )

    target_coverage: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )

    target_attainment: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )

    updated_at: Mapped[object] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )