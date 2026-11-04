from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CreateAdaptiveSessionRequest(BaseModel):
    research_id: int = Field(gt=0)
    max_questions: int = Field(default=10, ge=1, le=50)


class RespondentProfileRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=80)
    age: int = Field(ge=1, le=120)
    gender: Literal["Male", "Female", "Prefer not to say"]


class FeatureChallengeRequest(BaseModel):
    feature: Literal[
        "fast_heating",
        "affordable_price",
        "great_taste",
        "portability",
        "safety",
        "easy_to_use",
    ]


class SweetnessDialRequest(BaseModel):
    level: int = Field(ge=1, le=5)


class UsageOccasionRequest(BaseModel):
    location: Literal["hostel", "road_trip", "camping", "office", "travel", "picnic"]
    response: Literal["definitely", "maybe", "no"]