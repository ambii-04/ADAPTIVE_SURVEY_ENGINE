/** Shared answer distribution used by project and session reports. */
export interface AnswerDistributionItem {
  answer: string;
  count: number;
}

export interface QuestionResult {
  question_id: string;
  question: string;
  responses: number;
  answer_distribution: AnswerDistributionItem[];
}

/** One row of GET /api/v1/research/{id}/analytics → dimensions. */
export interface ProjectDimensionCoverage {
  dimension_id: number;
  name: string;
  importance: number;
  target_coverage: number;
  average_achieved_coverage: number;
  average_target_attainment: number;
  target_gap: number;
  sessions_with_coverage: number;
  eligible_sessions_without_coverage: number;
}

/** GET /api/v1/research/{id}/analytics */
export interface ResearchAnalytics {
  research_id: number;
  total_sessions: number;
  eligible_sessions: number;
  completed_sessions: number;
  question_results: QuestionResult[];
  dimensions: ProjectDimensionCoverage[];
  limitations: string[];
}

/** One row of GET /api/v1/sessions/{id}/report → dimension_coverage. */
export interface SessionDimensionCoverage {
  dimension_id: number;
  dimension: string;
  importance: number;
  achieved_coverage: number;
  target_coverage: number;
  target_attainment: number;
}

/** GET /api/v1/sessions/{id}/report */
export interface SessionReport {
  session_id: number;
  respondent_count: number;
  answer_count: number;
  question_results: QuestionResult[];
  dimension_coverage: SessionDimensionCoverage[];
}

export interface InsightItem {
  insight: string;
  evidence: string;
  caveat: string;
}

/** POST /api/v1/research/{id}/insights and POST /api/v1/sessions/{id}/insights. */
export interface InsightReport {
  research_id?: number;
  session_id?: number;
  respondent_count: number;
  insights: InsightItem[];
  limitations: string[];
}
