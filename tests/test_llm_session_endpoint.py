import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main as main
from app.db.database import Base
from app.db.models import ResearchDimension, ResearchProject, SurveyRun
from app.schemas.question import AnswerOption, SurveyBlueprint, SurveyQuestion
from app.schemas.session_requests import CreateAdaptiveSessionRequest


PLAN = {
    "research_id": 1,
    "research_objectives": ["Measure price sensitivity"],
    "constructs": [],
    "hypotheses": [],
    "dimension_info": [],
}


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def _add_project(db, research_plan=PLAN):
    project = ResearchProject(
        topic="Coffee preferences",
        target_audience="Coffee drinkers",
        geography="Mumbai",
        research_plan=research_plan,
        dimensions=[
            ResearchDimension(
                name="Price", importance=9, target_coverage=0.8,
                achieved_coverage=0,
            ),
            ResearchDimension(
                name="Interest", importance=7, target_coverage=0.6,
                achieved_coverage=0,
            ),
        ],
    )
    db.add(project)
    db.commit()
    return project


def _survey():
    return SurveyBlueprint(
        research_id=1,
        title="Coffee Survey",
        questions=[
            SurveyQuestion(
                question_id="Q001",
                text="Which age group are you in?",
                question_type="single_choice",
                options=[AnswerOption(option_id="A1", label="18-26")],
            )
        ],
    )


def test_session_is_built_from_saved_project_data(monkeypatch, db):
    project = _add_project(db)
    captured = {}

    def fake_build(**kwargs):
        captured.update(kwargs)
        return _survey()

    monkeypatch.setattr(main, "build_survey_with_llm", fake_build)

    result = main.create_llm_session(
        CreateAdaptiveSessionRequest(research_id=project.id, max_questions=12),
        db=db,
    )

    assert captured == {
        "research_id": project.id,
        "topic": "Coffee preferences",
        "dimensions": ["Price", "Interest"],
        "research_plan": PLAN,
        "target_audience": "Coffee drinkers",
        "geography": "Mumbai",
        "max_questions": 12,
    }
    assert result["research_id"] == project.id
    assert result["question_budget"] == 12

    run = db.query(SurveyRun).one()
    assert run.project_id == project.id
    assert run.max_questions == 12


def test_missing_project_returns_404(db):
    with pytest.raises(HTTPException) as exc:
        main.create_llm_session(
            CreateAdaptiveSessionRequest(research_id=999),
            db=db,
        )

    assert exc.value.status_code == 404


def test_project_without_research_plan_returns_409(db):
    project = _add_project(db, research_plan=None)

    with pytest.raises(HTTPException) as exc:
        main.create_llm_session(
            CreateAdaptiveSessionRequest(research_id=project.id),
            db=db,
        )

    assert exc.value.status_code == 409
