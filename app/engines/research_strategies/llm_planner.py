from app.schemas.research_plan import ResearchPlan
from app.services.agentcab_client import (
    RESEARCH_PLAN_WORKFLOW,
    run_workflow,
)


def generate_research_plan_with_llm(
    research_id: int,
    topic: str,
    target_audience: str,
    geography: str,
    dimensions: list[str],
) -> ResearchPlan:

    payload = run_workflow(
        RESEARCH_PLAN_WORKFLOW,
        {
            "topic": topic,
            "target_audience": target_audience,
            "geography": geography,
            "dimensions": dimensions,
        },
    )

    # Keep the research ID supplied by our application.
    result = ResearchPlan.model_validate(
        {**payload, "research_id": research_id}
    )

    expected_dimensions = set(dimensions)
    actual_dimensions = {item.dimension for item in result.constructs}

    if not expected_dimensions.issubset(actual_dimensions):
        raise ValueError("Research plan did not cover every supplied dimension.")

    return result
