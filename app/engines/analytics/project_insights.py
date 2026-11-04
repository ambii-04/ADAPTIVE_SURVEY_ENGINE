from app.schemas.project_insights import ProjectInsightReport
from app.services.agentcab_client import INSIGHTS_WORKFLOW, run_workflow


def generate_project_insights(report: dict) -> ProjectInsightReport:
    payload = run_workflow(INSIGHTS_WORKFLOW, report)

    # Counts and IDs come from our own analytics, so the application sets
    # them rather than trusting the generated values.
    return ProjectInsightReport.model_validate(
        {
            **payload,
            "research_id": report["research_id"],
            "respondent_count": report["eligible_sessions"],
        }
    )
