import { apiFetch, apiFetchBlob, LLM_TIMEOUT_MS } from './apiClient';
import { InsightReport, ResearchAnalytics, SessionReport } from '../types/analytics';

export const analyticsApi = {
  /**
   * Calls GET /api/v1/sessions/{session_id}/report
   */
  async getSessionReport(sessionId: number | string): Promise<SessionReport> {
    return await apiFetch<SessionReport>(`/api/v1/sessions/${encodeURIComponent(String(sessionId))}/report`);
  },

  /**
   * Calls GET /api/v1/sessions/{session_id}/export.csv
   */
  async exportSessionCsv(sessionId: number | string): Promise<Blob> {
    return await apiFetchBlob(`/api/v1/sessions/${encodeURIComponent(String(sessionId))}/export.csv`);
  },

  /**
   * Calls POST /api/v1/sessions/{session_id}/insights
   */
  async generateSessionInsights(sessionId: number | string): Promise<InsightReport> {
    return await apiFetch<InsightReport>(`/api/v1/sessions/${encodeURIComponent(String(sessionId))}/insights`, {
      method: 'POST',
      timeoutMs: LLM_TIMEOUT_MS,
    });
  },

  /**
   * Calls GET /api/v1/research/{research_id}/analytics
   */
  async getResearchAnalytics(researchId: number | string): Promise<ResearchAnalytics> {
    return await apiFetch<ResearchAnalytics>(`/api/v1/research/${encodeURIComponent(String(researchId))}/analytics`);
  },

  /**
   * Calls GET /api/v1/research/{research_id}/export.csv
   */
  async exportResearchCsv(researchId: number | string): Promise<Blob> {
    return await apiFetchBlob(`/api/v1/research/${encodeURIComponent(String(researchId))}/export.csv`);
  },

  /**
   * Calls POST /api/v1/research/{research_id}/insights
   */
  async generateResearchInsights(researchId: number | string): Promise<InsightReport> {
    return await apiFetch<InsightReport>(`/api/v1/research/${encodeURIComponent(String(researchId))}/insights`, {
      method: 'POST',
      timeoutMs: LLM_TIMEOUT_MS,
    });
  },
};
