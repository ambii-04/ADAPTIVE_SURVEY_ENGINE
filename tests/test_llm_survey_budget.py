import pytest

import app.engines.survey_architect.llm_architect as architect
from app.schemas.question import AnswerOption, SurveyBlueprint, SurveyQuestion


def _survey(question_count):
    """Build a survey with the Q001 age screener plus `question_count` others."""
    questions = [
        SurveyQuestion(
            question_id="Q001",
            text="Which age group are you in?",
            question_type="single_choice",
            options=[AnswerOption(option_id="A1", label="18-26")],
        )
    ] + [
        SurveyQuestion(
            question_id=f"Q{index:03d}",
            text=f"Question {index}?",
            question_type="single_choice",
            options=[AnswerOption(option_id="A1", label="Yes")],
        )
        for index in range(2, question_count + 2)
    ]
    return SurveyBlueprint(research_id=1, title="Survey", questions=questions)


def _build(monkeypatch, survey, max_questions):
    monkeypatch.setattr(
        architect,
        "run_workflow",
        lambda workflow, inputs: survey.model_dump(mode="json"),
    )
    return architect.build_survey_with_llm(
        research_id=1,
        topic="Coffee",
        dimensions=["Interest"],
        research_plan={},
        max_questions=max_questions,
    )


def test_age_screener_is_allowed_beyond_question_budget(monkeypatch):
    result = _build(monkeypatch, _survey(8), max_questions=8)

    assert len(result.questions) == 9
    assert result.questions[0].question_id == "Q001"
    assert result.questions[0].required is True


def test_agent_may_return_a_few_questions_above_max_questions(monkeypatch):
    result = _build(monkeypatch, _survey(11), max_questions=8)

    assert len(result.questions) == 12
    assert [q.question_id for q in result.questions][:2] == ["Q001", "Q002"]


def test_runtime_budget_caps_respondent_questions(monkeypatch):
    from app.engines.adaptive.selector import select_next_question

    survey = _build(monkeypatch, _survey(11), max_questions=8)

    question, _, status = select_next_question(
        questions=survey.questions,
        dimensions=[],
        coverage={},
        answered_ids=[],
        response_options={},
        asked_count=8,
        max_questions=8,
    )

    assert question is None
    assert status == "question_budget_reached"
