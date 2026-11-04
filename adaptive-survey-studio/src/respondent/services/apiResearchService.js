import { getApiBaseUrl } from '../../services/apiConfig';
import { studyStore } from '../../services/studyStore';

// Used when the study owner has not compiled a survey from this browser. Matches the backend default.
const DEFAULT_MAX_QUESTIONS = 10;

async function request(path, options = {}) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      `Cannot connect to the survey API at ${baseUrl}. Check that the adaptive survey backend is running.`,
      { cause: error },
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(', ')
      : detail || `Survey API request failed (${response.status}).`;
    const failure = new Error(message);
    failure.status = response.status;
    throw failure;
  }

  return payload;
}

/** Question budget for a study, from the owner's last compile in this browser. */
export function getStudyMaxQuestions(researchId) {
  return studyStore.get(researchId).maxQuestions ?? DEFAULT_MAX_QUESTIONS;
}

export const apiResearchService = {
  /** POST /api/v1/llm/sessions: the backend builds this respondent's survey from the study's plan. */
  async createRespondentSession({ researchId, maxQuestions }) {
    const session = await request('/api/v1/llm/sessions', {
      method: 'POST',
      body: JSON.stringify({ research_id: Number(researchId), max_questions: maxQuestions }),
    });

    return {
      sessionId: session.session_id,
      totalQuestions: session.question_budget,
    };
  },

  getNextQuestion({ sessionId }) {
    return request(`/api/v1/sessions/${sessionId}/next`);
  },

  submitRespondentProfile({ sessionId, name, age, gender }) {
    return request(`/api/v1/sessions/${sessionId}/respondent-profile`, {
      method: 'POST',
      body: JSON.stringify({ name, age, gender }),
    });
  },

  submitResponse({ sessionId, questionId, optionId, answerValue }) {
    return request(`/api/v1/sessions/${sessionId}/responses`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        ...(optionId ? { option_id: optionId } : {}),
        ...(answerValue !== undefined ? { answer_value: answerValue } : {}),
      }),
    });
  },

  submitFeatureChallenge({ sessionId, feature }) {
    return request(`/api/v1/sessions/${sessionId}/feature-challenge`, {
      method: 'POST',
      body: JSON.stringify({ feature }),
    });
  },

  submitSweetnessDial({ sessionId, level }) {
    return request(`/api/v1/sessions/${sessionId}/sweetness-dial`, {
      method: 'POST',
      body: JSON.stringify({ level }),
    });
  },

  submitUsageOccasion({ sessionId, location, response }) {
    return request(`/api/v1/sessions/${sessionId}/usage-occasion`, {
      method: 'POST',
      body: JSON.stringify({ location, response }),
    });
  },
};
