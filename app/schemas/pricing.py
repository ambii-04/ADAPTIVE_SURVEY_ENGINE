from pydantic import BaseModel, ConfigDict, Field, field_validator


class PricingAgentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: str = Field(min_length=1)
    month: str = Field(min_length=1)

    @field_validator("city", "month")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field must not be blank.")
        return value


class PricingAgentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str
