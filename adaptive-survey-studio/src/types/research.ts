/** Shape returned by POST /api/v1/llm/research-plan (and stored by the backend). */
export interface ResearchConstruct {
  name: string;
  dimension: string;
  measurement_method: string;
}

export interface ResearchHypothesis {
  hypothesis_id: string;
  statement: string;
  dimension: string;
}

export interface ResearchDimensionInfo {
  dimension: string;
  importance: number;
  target_coverage: number;
}

export interface ResearchPlan {
  research_id: number;
  research_objectives: string[];
  constructs: ResearchConstruct[];
  hypotheses: ResearchHypothesis[];
  dimension_info: ResearchDimensionInfo[];
}

/** Shape returned by POST /api/v1/llm/sessions. */
export interface CompiledSurvey {
  session_id: number;
  research_id: number;
  status: string;
  question_budget: number;
  survey_title: string;
  total_questions: number;
}

/** A study as the frontend uses it. Backend fields plus what this browser cached. */
export interface ResearchProject {
  id: number;
  topic: string;
  target_audience: string;
  geography: string;
  dimensions: string[];
  /** Cached in this browser: GET /api/v1/research/{id} does not return the plan. */
  research_plan?: ResearchPlan;
  /** Cached in this browser: the question budget used for the last compiled survey. */
  max_questions?: number;
  /** Cached in this browser: the last compiled survey. */
  survey?: CompiledSurvey;
}

/** Body of POST /api/v1/research. */
export interface CreateResearchPayload {
  topic: string;
  target_audience: string;
  geography: string;
  dimensions: string[];
}

/** Body of POST /api/v1/llm/research-plan. The backend loads the rest from the database. */
export interface GenerateResearchPlanPayload {
  research_id: number;
}

/** Body of POST /api/v1/llm/sessions. The backend loads the rest from the database. */
export interface GenerateSurveyPayload {
  research_id: number;
  max_questions: number;
}
