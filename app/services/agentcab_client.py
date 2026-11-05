import json
import os
import time
from dataclasses import dataclass
from pathlib import Path

import requests
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"

if ENV_FILE.exists():
    load_dotenv(ENV_FILE)


SYNC_WAIT_SECONDS = 30
POLL_INTERVAL_SECONDS = 5
JOB_TIMEOUT_SECONDS = 300
REQUEST_TIMEOUT_SECONDS = 60


@dataclass(frozen=True)
class AgentcabWorkflow:
    name: str
    jobs_url: str
    client_id_env: str
    client_secret_env: str

    def credentials(self) -> tuple[str, str]:
        client_id = os.getenv(self.client_id_env)
        client_secret = os.getenv(self.client_secret_env)

        missing = [
            key
            for key, value in {
                self.client_id_env: client_id,
                self.client_secret_env: client_secret,
            }.items()
            if not value
        ]

        if missing:
            raise RuntimeError(
                f"Missing Agentcab configuration in .env: {', '.join(missing)}"
            )

        return client_id, client_secret


RESEARCH_PLAN_WORKFLOW = AgentcabWorkflow(
    name="research plan",
    jobs_url=(
        "https://agentcab-cka4dbawfefpfcff.a03.azurefd.net/project/exports"
        "/rest-api/6ae05402c7d207caaa3ee891/jobs"
    ),
    client_id_env="AGENTCAB_RESEARCH_PLAN_CLIENT_ID",
    client_secret_env="AGENTCAB_RESEARCH_PLAN_CLIENT_SECRET",
)

SURVEY_WORKFLOW = AgentcabWorkflow(
    name="survey",
    jobs_url=(
        "https://agentcab-cka4dbawfefpfcff.a03.azurefd.net/project/exports"
        "/rest-api/6ae0548bc7d207caaa3eec9e/jobs"
    ),
    client_id_env="AGENTCAB_SURVEY_CLIENT_ID",
    client_secret_env="AGENTCAB_SURVEY_CLIENT_SECRET",
)

INSIGHTS_WORKFLOW = AgentcabWorkflow(
    name="insights",
    jobs_url=(
        "https://agentcab-cka4dbawfefpfcff.a03.azurefd.net/project/exports"
        "/rest-api/6ae0885d8119a043df7b322a/jobs"
    ),
    client_id_env="AGENTCAB_INSIGHTS_CLIENT_ID",
    client_secret_env="AGENTCAB_INSIGHTS_CLIENT_SECRET",
)

PRICING_WORKFLOW = AgentcabWorkflow(
    name="pricing",
    jobs_url=(
        "https://ccp-agentc-uat.dentsu.com/project/exports"
        "/rest-api/6addbfd4c7d207caaa391b70/jobs"
    ),
    client_id_env="AGENTCAB_PRICING_CLIENT_ID",
    client_secret_env="AGENTCAB_PRICING_CLIENT_SECRET",
)


def run_workflow(
    workflow: AgentcabWorkflow,
    inputs: dict,
    *,
    allow_plain_text_output: bool = False,
) -> dict:
    """
    Run an Agentcab job and return the generated JSON payload.

    The job is started with a synchronous wait. If it is not finished by
    then, the runId is polled until the job completes or times out.
    """

    client_id, client_secret = workflow.credentials()
    headers = {
        "x-client-id": client_id,
        "x-client-secret": client_secret,
    }

    try:
        response = requests.post(
            workflow.jobs_url,
            params={"waitSeconds": SYNC_WAIT_SECONDS},
            headers=headers,
            json=inputs,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        job = _read_job(response, workflow)

        deadline = time.monotonic() + JOB_TIMEOUT_SECONDS
        run_id = job.get("runId")

        while not job.get("isCompleted"):
            if not run_id or time.monotonic() > deadline:
                raise RuntimeError(
                    f"Agentcab {workflow.name} job did not complete in time."
                )

            time.sleep(POLL_INTERVAL_SECONDS)
            poll = requests.get(
                f"{workflow.jobs_url}/{run_id}",
                headers=headers,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            job = _read_job(poll, workflow)

    except requests.RequestException as exc:
        raise RuntimeError(
            f"Could not reach Agentcab {workflow.name} service: {exc}"
        ) from exc

    if not job.get("success"):
        detail = job.get("error") or job.get("failure") or "unknown error"
        raise ValueError(f"Agentcab {workflow.name} job failed: {detail}")

    return _extract_payload(job, workflow, allow_plain_text_output)


def _read_job(response: requests.Response, workflow: AgentcabWorkflow) -> dict:
    if not response.ok:
        raise RuntimeError(
            f"Agentcab {workflow.name} request failed with HTTP "
            f"{response.status_code}: {response.text[:300]}"
        )

    body = response.json()

    # Responses arrive wrapped as {"statusCode", "message", "data": {...}}.
    if isinstance(body.get("data"), dict):
        return body["data"]

    return body


def _extract_payload(
    job: dict,
    workflow: AgentcabWorkflow,
    allow_plain_text_output: bool = False,
) -> dict:
    output = job.get("output") or {}

    if allow_plain_text_output:
        variables = output.get("variables") if isinstance(output, dict) else None
        candidates = [
            variables.get("payload") if isinstance(variables, dict) else None,
            variables,
            output,
        ]
        for candidate in candidates:
            if isinstance(candidate, dict) and isinstance(candidate.get("text"), str):
                return {"text": candidate["text"]}

        text = output.get("text") if isinstance(output, dict) else None
        if isinstance(text, str):
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError:
                return {"text": text}
            if isinstance(parsed, dict) and isinstance(parsed.get("text"), str):
                return {"text": parsed["text"]}

        output_keys = sorted(output.keys()) if isinstance(output, dict) else []
        variable_keys = sorted(variables.keys()) if isinstance(variables, dict) else []
        payload = variables.get("payload") if isinstance(variables, dict) else None
        payload_keys = sorted(payload.keys()) if isinstance(payload, dict) else []
        raise ValueError(
            f"Agentcab {workflow.name} job completed without the required "
            f"'text' report (output fields: {output_keys}; "
            f"variable fields: {variable_keys}; payload fields: {payload_keys})."
        )

    variables = output.get("variables") or {}
    payload = variables.get("payload")
    if isinstance(payload, dict):
        return payload

    text = output.get("text")
    if isinstance(text, str):
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, dict):
            return parsed
    raise ValueError(
        f"Agentcab {workflow.name} job completed without a JSON payload."
    )
