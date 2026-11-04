from app.schemas.question import SurveyBlueprint
from app.services.agentcab_client import SURVEY_WORKFLOW, run_workflow


def build_survey_with_llm(
    research_id: int,
    topic: str,
    dimensions: list[str],
    research_plan: dict,
    target_audience: str = "Target respondents",
    geography: str = "Not specified",
    max_questions: int = 15,
) -> SurveyBlueprint:

    payload = run_workflow(
        SURVEY_WORKFLOW,
        {
            "topic": topic,
            "dimensions": dimensions,
            "research_plan": research_plan,
            "target_audience": target_audience,
            "geography": geography,
            "max_questions": max_questions,
        },
    )

    result = SurveyBlueprint.model_validate(
        {**payload, "research_id": research_id}
    )

    if not result.questions:
        raise ValueError("The agent generated a survey with no questions.")

    # The agent may return a few questions above max_questions. The limit is
    # enforced at runtime by the question selector, so the blueprint is kept whole.

    question_ids = [q.question_id for q in result.questions]
    if len(question_ids) != len(set(question_ids)):
        raise ValueError("Survey contains duplicate question IDs.")

    option_ids_by_question = {}

    for question in result.questions:
        option_ids = [option.option_id for option in question.options]

        if len(option_ids) != len(set(option_ids)):
            raise ValueError(
                f"Duplicate option IDs found in {question.question_id}."
            )

        option_ids_by_question[question.question_id] = set(option_ids)

        unknown_dimensions = (
            set(question.dimension_mappings) - set(dimensions)
        )
        if unknown_dimensions:
            raise ValueError(
                f"{question.question_id} uses unknown dimensions: "
                f"{sorted(unknown_dimensions)}"
            )

        for option in question.options:
            unknown_option_dimensions = (
                set(option.dimension_values) - set(dimensions)
            )
            if unknown_option_dimensions:
                raise ValueError(
                    f"{question.question_id} option {option.option_id} "
                    f"uses unknown dimensions: "
                    f"{sorted(unknown_option_dimensions)}"
                )

    # Validate conditional references after collecting all question IDs.
    for question in result.questions:
        if question.depends_on:
            if question.depends_on not in option_ids_by_question:
                raise ValueError(
                    f"{question.question_id} references an unknown parent question."
                )

            if question.show_if_option_id not in option_ids_by_question[
                question.depends_on
            ]:
                raise ValueError(
                    f"{question.question_id} references an unknown parent option."
                )

    # Validate screening question.
    screening = result.questions[0]

    if screening.question_id != "Q001":
        raise ValueError("The first question must be Q001 screening.")

    if screening.question_type != "single_choice":
        raise ValueError("Q001 must be a single-choice screening question.")

    screening.required = True

    return result