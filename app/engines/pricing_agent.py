from app.schemas.pricing import PricingAgentRequest, PricingAgentResponse
from app.services.agentcab_client import PRICING_WORKFLOW, run_workflow


def generate_pricing_report(
    city: str,
    month: str,
) -> PricingAgentResponse:
    payload = run_workflow(
        PRICING_WORKFLOW,
        {"city": city, "month": month},
        allow_plain_text_output=True,
    )
    return PricingAgentResponse.model_validate(payload)
