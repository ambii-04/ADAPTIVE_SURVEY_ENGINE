import { apiFetch, LLM_TIMEOUT_MS } from './apiClient';
import {
  NextQuestionResponse,
  SubmitResponsePayload,
  SubmitResponseResult,
} from '../types/survey';

export const surveyApi = {
  /**
   * Starts a respondent session. The backend builds a fresh survey for it.
   * Calls POST /api/v1/llm/sessions
   */
  async createRespondentSession(researchId: number, maxQuestions: number): Promise<{ session_id: number }> {
    return await apiFetch<{ session_id: number }>('/api/v1/llm/sessions', {
      method: 'POST',
      body: JSON.stringify({ research_id: researchId, max_questions: maxQuestions }),
      timeoutMs: LLM_TIMEOUT_MS,
    });
  },

  /**
   * Fetches the next adaptive question for a respondent session.
   * Calls GET /api/v1/sessions/{session_id}/next
   */
  async getNextQuestion(sessionId: string): Promise<NextQuestionResponse> {
    return await apiFetch<NextQuestionResponse>(`/api/v1/sessions/${encodeURIComponent(sessionId)}/next`);
  },

  /**
   * Submits an answer to the current question.
   * Calls POST /api/v1/sessions/{session_id}/responses
   */
  async submitResponse(sessionId: string, payload: SubmitResponsePayload): Promise<SubmitResponseResult> {
    return await apiFetch<SubmitResponseResult>(`/api/v1/sessions/${encodeURIComponent(sessionId)}/responses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
