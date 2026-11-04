import pytest

import app.services.agentcab_client as client


class FakeResponse:
    def __init__(self, body, status_code=201):
        self._body = body
        self.status_code = status_code
        self.ok = 200 <= status_code < 300
        self.text = str(body)

    def json(self):
        return self._body


def _wrap(data):
    return {"statusCode": 201, "message": "Fetched successfully", "data": data}


PAYLOAD = {
    "research_id": 1,
    "research_objectives": ["Measure price sensitivity"],
    "constructs": [],
    "hypotheses": [],
    "dimension_info": [],
}


@pytest.fixture
def workflow_env(monkeypatch):
    monkeypatch.setenv("TEST_CLIENT_ID", "cx_test")
    monkeypatch.setenv("TEST_CLIENT_SECRET", "secret_test")
    monkeypatch.setattr(client, "POLL_INTERVAL_SECONDS", 0)
    return client.AgentcabWorkflow(
        name="test",
        jobs_url="https://example.test/jobs",
        client_id_env="TEST_CLIENT_ID",
        client_secret_env="TEST_CLIENT_SECRET",
    )


def test_completed_job_returns_variables_payload(monkeypatch, workflow_env):
    job = {
        "runId": "run-1",
        "isCompleted": True,
        "success": True,
        "output": {"variables": {"payload": PAYLOAD}, "text": "{}"},
    }
    calls = []

    def fake_post(url, params, headers, json, timeout):
        calls.append((url, params, headers, json))
        return FakeResponse(_wrap(job))

    monkeypatch.setattr(client.requests, "post", fake_post)

    result = client.run_workflow(workflow_env, {"topic": "Coffee"})

    assert result == PAYLOAD
    url, params, headers, body = calls[0]
    assert url == "https://example.test/jobs"
    assert params == {"waitSeconds": client.SYNC_WAIT_SECONDS}
    assert headers == {"x-client-id": "cx_test", "x-client-secret": "secret_test"}
    assert body == {"topic": "Coffee"}


def test_accepted_job_is_polled_until_completed(monkeypatch, workflow_env):
    accepted = {"runId": "run-2", "isCompleted": False, "success": False}
    completed = {
        "runId": "run-2",
        "isCompleted": True,
        "success": True,
        "output": {"variables": {"payload": PAYLOAD}},
    }
    polled_urls = []

    monkeypatch.setattr(
        client.requests,
        "post",
        lambda *args, **kwargs: FakeResponse(_wrap(accepted)),
    )

    def fake_get(url, headers, timeout):
        polled_urls.append(url)
        return FakeResponse(_wrap(completed), status_code=200)

    monkeypatch.setattr(client.requests, "get", fake_get)

    result = client.run_workflow(workflow_env, {})

    assert result == PAYLOAD
    assert polled_urls == ["https://example.test/jobs/run-2"]


def test_text_output_is_used_when_variables_are_missing(monkeypatch, workflow_env):
    job = {
        "isCompleted": True,
        "success": True,
        "output": {"text": '{"research_id": 1, "title": "T", "questions": []}'},
    }
    monkeypatch.setattr(
        client.requests,
        "post",
        lambda *args, **kwargs: FakeResponse(job, status_code=200),
    )

    result = client.run_workflow(workflow_env, {})

    assert result == {"research_id": 1, "title": "T", "questions": []}


def test_failed_job_raises_value_error(monkeypatch, workflow_env):
    job = {"isCompleted": True, "success": False, "error": "node crashed"}
    monkeypatch.setattr(
        client.requests,
        "post",
        lambda *args, **kwargs: FakeResponse(_wrap(job)),
    )

    with pytest.raises(ValueError, match="node crashed"):
        client.run_workflow(workflow_env, {})


def test_missing_credentials_raise_runtime_error(monkeypatch, workflow_env):
    monkeypatch.delenv("TEST_CLIENT_SECRET")

    with pytest.raises(RuntimeError, match="TEST_CLIENT_SECRET"):
        client.run_workflow(workflow_env, {})
