/** Question shape returned inside GET /api/v1/sessions/{id}/next. */
export type QuestionType = 'single_choice' | 'multiple_choice' | 'likert' | 'price_input';

export interface AnswerOption {
  option_id: string;
  label: string;
  dimension_values?: Record<string, number>;
}

export interface SurveyQuestion {
  question_id: string;
  text: string;
  question_type: QuestionType;
  dimension_mappings: Record<string, number>;
  options: AnswerOption[];
  required: boolean;
  estimated_seconds?: number;
}

/** Response of GET /api/v1/sessions/{id}/next. next_question is null once the session has ended. */
export interface NextQuestionResponse {
  status: string;
  next_question: SurveyQuestion | null;
  scores?: unknown[];
  weighted_coverage: number;
  target_attainment: number;
  dimension_coverage: Record<string, number>;
}

/** Body of POST /api/v1/sessions/{id}/responses (AnswerSubmission). */
export interface SubmitResponsePayload {
  question_id: string;
  option_id?: string | null;
  answer_value?: string[] | number | null;
}

/** Response of POST /api/v1/sessions/{id}/responses. */
export interface SubmitResponseResult {
  status: 'answer_saved' | 'ineligible' | string;
  session_id: number;
  question_id: string;
  [key: string]: unknown;
}

/** Answer draft produced by QuestionRenderer, turned into a SubmitResponsePayload by the page. */
export interface AnswerDraft {
  option_id?: string;
  option_ids?: string[];
  price?: number;
}
