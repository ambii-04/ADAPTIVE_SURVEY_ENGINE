import pytest
from fastapi import HTTPException

from app.engines import pricing_agent
from app.main import create_pricing_report
from app.schemas.pricing import PricingAgentRequest, PricingAgentResponse


def test_pricing_agent_uses_pricing_workflow(monkeypatch):
    def fake_run_workflow(workflow, inputs, *, allow_plain_text_output):
        assert workflow == pricing_agent.PRICING_WORKFLOW
        assert inputs == {"city": "Pune", "month": "November"}
        assert allow_plain_text_output is True
        return {"text": "# Pricing recommendation"}

    monkeypatch.setattr(pricing_agent, "run_workflow", fake_run_workflow)

    result = pricing_agent.generate_pricing_report("Pune", "November")

    assert result.text == "# Pricing recommendation"


def test_pricing_report_forwards_city_and_month(monkeypatch):
    def fake_generate_pricing_report(city, month):
        assert city == "Pune"
        assert month == "November"
        return PricingAgentResponse(text="# Pricing recommendation")

    monkeypatch.setattr("app.main.generate_pricing_report", fake_generate_pricing_report)

    result = create_pricing_report(
        PricingAgentRequest(city="Pune", month="November")
    )

    assert result.text == "# Pricing recommendation"


@pytest.mark.parametrize(
    ("error", "status_code"),
    [(RuntimeError("Missing pricing credentials"), 503), (ValueError("Invalid output"), 502)],
)
def test_pricing_report_maps_agent_errors(monkeypatch, error, status_code):
    def fail_generate_pricing_report(city, month):
        raise error

    monkeypatch.setattr("app.main.generate_pricing_report", fail_generate_pricing_report)

    with pytest.raises(HTTPException) as exc_info:
        create_pricing_report(PricingAgentRequest(city="Pune", month="November"))

    assert exc_info.value.status_code == status_code
