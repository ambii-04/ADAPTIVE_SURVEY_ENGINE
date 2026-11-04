import app.engines.analytics.project_insights as insights
from app.schemas.project_insights import ProjectInsight, ProjectInsightReport


REPORT = {
    "research_id": 7,
    "total_sessions": 5,
    "eligible_sessions": 4,
    "completed_sessions": 3,
    "question_results": [],
    "dimensions": [],
    "limitations": ["Small sample."],
}


def _payload(**overrides):
    model = ProjectInsightReport(
        research_id=7,
        respondent_count=3,
        insights=[
            ProjectInsight(
                insight="Most respondents live in Mumbai.",
                evidence="Q002 Yes=3, No=1.",
                caveat="Small sample.",
            )
        ],
        limitations=["Small sample."],
    ).model_dump(mode="json")
    model.update(overrides)
    return model


def test_project_insights_sends_report_and_uses_workflow(monkeypatch):
    sent = {}

    def fake_run(workflow, inputs):
        sent["workflow"] = workflow
        sent["inputs"] = inputs
        return _payload()

    monkeypatch.setattr(insights, "run_workflow", fake_run)

    result = insights.generate_project_insights(REPORT)

    assert sent["inputs"] == REPORT
    assert sent["workflow"] is insights.INSIGHTS_WORKFLOW
    assert len(result.insights) == 1


def test_project_insights_sets_ids_and_counts_from_report(monkeypatch):
    monkeypatch.setattr(
        insights,
        "run_workflow",
        lambda workflow, inputs: _payload(research_id=99, respondent_count=3),
    )

    result = insights.generate_project_insights(REPORT)

    assert result.research_id == 7
    assert result.respondent_count == REPORT["eligible_sessions"]
