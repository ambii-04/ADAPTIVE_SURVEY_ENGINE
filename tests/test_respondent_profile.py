import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main as main
from app.db.database import Base
from app.db.models import ResearchDimension, ResearchProject, SurveyRun
from app.schemas.question import AnswerOption, SurveyBlueprint, SurveyQuestion
from app.schemas.session_requests import (
    FeatureChallengeRequest,
    RespondentProfileRequest,
    SweetnessDialRequest,
    UsageOccasionRequest,
)


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


def _survey():
    age = SurveyQuestion(
        question_id="Q001",
        text="Which age group are you in?",
        question_type="single_choice",
        required=True,
        options=[
            AnswerOption(option_id="A1", label="18-26"),
            AnswerOption(option_id="A2", label="Under 18"),
        ],
    )
    interest = SurveyQuestion(
        question_id="Q002",
        text="How interested are you?",
        question_type="single_choice",
        dimension_mappings={"Interest": 1.0},
        options=[AnswerOption(option_id="A1", label="Very")],
    )
    follow_up = SurveyQuestion(
        question_id="Q003",
        text="Would you buy it again?",
        question_type="single_choice",
        dimension_mappings={"Interest": 0.5},
        depends_on="Q001",
        show_if_option_id="A1",
        options=[AnswerOption(option_id="A1", label="Yes")],
    )
    return SurveyBlueprint(
        research_id=1,
        title="Survey",
        questions=[age, interest, follow_up],
    )


def _add_session(db):
    project = ResearchProject(
        topic="Hot chocolate",
        target_audience="Adults",
        geography="India",
        research_plan={"research_objectives": []},
        dimensions=[
            ResearchDimension(
                name="Interest", importance=8, target_coverage=0.8, achieved_coverage=0,
            ),
        ],
    )
    db.add(project)
    db.commit()
    run = SurveyRun(
        project_id=project.id,
        status="active",
        max_questions=10,
        survey_json=_survey().model_dump(mode="json"),
        served_question_ids=[],
        current_question_id=None,
    )
    db.add(run)
    db.commit()
    return run


def _profile(age=25, name="Asha", gender="Female"):
    return RespondentProfileRequest(name=name, age=age, gender=gender)


def test_profile_is_stored_and_age_screener_is_removed(db):
    run = _add_session(db)

    result = main.submit_respondent_profile(run.id, _profile(), db=db)

    db.refresh(run)
    assert result == {"session_id": run.id, "status": "active", "age_eligible": True}
    assert (run.respondent_name, run.respondent_age, run.respondent_gender) == (
        "Asha", 25, "Female",
    )
    question_ids = [q["question_id"] for q in run.survey_json["questions"]]
    assert question_ids == ["Q002", "Q003"]
    follow_up = run.survey_json["questions"][1]
    assert follow_up["depends_on"] is None
    assert follow_up["show_if_option_id"] is None


def test_first_question_never_asks_age(db):
    run = _add_session(db)
    main.submit_respondent_profile(run.id, _profile(), db=db)

    next_question = main.get_next_question(run.id, db=db)

    assert next_question["next_question"]["question_id"] != "Q001"


def test_under_18_is_marked_ineligible(db):
    run = _add_session(db)

    result = main.submit_respondent_profile(run.id, _profile(age=16), db=db)

    db.refresh(run)
    assert result["age_eligible"] is False
    assert run.status == "ineligible"
    next_question = main.get_next_question(run.id, db=db)
    assert next_question == {"status": "ineligible", "next_question": None}


def test_profile_cannot_be_submitted_twice(db):
    run = _add_session(db)
    main.submit_respondent_profile(run.id, _profile(), db=db)

    with pytest.raises(HTTPException) as exc:
        main.submit_respondent_profile(run.id, _profile(name="Other"), db=db)

    assert exc.value.status_code == 409


def test_profile_is_rejected_after_a_question_was_served(db):
    run = _add_session(db)
    main.get_next_question(run.id, db=db)

    with pytest.raises(HTTPException) as exc:
        main.submit_respondent_profile(run.id, _profile(), db=db)

    assert exc.value.status_code == 409


def test_unknown_session_returns_404(db):
    with pytest.raises(HTTPException) as exc:
        main.submit_respondent_profile(999, _profile(), db=db)

    assert exc.value.status_code == 404


def test_invalid_profile_values_are_rejected():
    with pytest.raises(ValidationError):
        RespondentProfileRequest(name="Asha", age=25, gender="Unknown")
    with pytest.raises(ValidationError):
        RespondentProfileRequest(name="   ", age=25, gender="Female")
    with pytest.raises(ValidationError):
        RespondentProfileRequest(name="Asha", age=0, gender="Female")


def test_mini_game_results_are_stored_in_survey_db(db):
    run = _add_session(db)

    main.submit_feature_challenge(run.id, FeatureChallengeRequest(feature="safety"), db=db)
    main.submit_sweetness_dial(run.id, SweetnessDialRequest(level=4), db=db)
    main.submit_usage_occasion(
        run.id, UsageOccasionRequest(location="office", response="maybe"), db=db,
    )
    main.submit_usage_occasion(
        run.id, UsageOccasionRequest(location="picnic", response="definitely"), db=db,
    )

    db.refresh(run)
    assert run.respondent_extras == {
        "feature_challenge": "safety",
        "sweetness_dial": 4,
        "usage_occasion": {"office": "maybe", "picnic": "definitely"},
    }


def test_mini_game_values_outside_the_options_are_rejected():
    with pytest.raises(ValidationError):
        FeatureChallengeRequest(feature="free_coffee")
    with pytest.raises(ValidationError):
        SweetnessDialRequest(level=9)
    with pytest.raises(ValidationError):
        UsageOccasionRequest(location="space", response="yes")
