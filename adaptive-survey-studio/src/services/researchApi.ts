import { apiFetch, ApiError, LLM_TIMEOUT_MS } from './apiClient';
import { studyStore } from './studyStore';
import {
  CreateResearchPayload,
  CompiledSurvey,
  GenerateResearchPlanPayload,
  GenerateSurveyPayload,
  ResearchPlan,
  ResearchProject,
} from '../types/research';

/** Shape of GET /api/v1/research/{id} and POST /api/v1/research. */
interface RawResearch {
  id: number;
  topic: string;
  target_audience: string;
  geography: string;
  dimensions: (string | { name: string })[];
}

function toProject(raw: RawResearch): ResearchProject {
  const cached = studyStore.get(raw.id);
  return {
    id: raw.id,
    topic: raw.topic,
    target_audience: raw.target_audience,
    geography: raw.geography,
    dimensions: raw.dimensions.map((d) => (typeof d === 'string' ? d : d.name)),
    research_plan: cached.plan,
    max_questions: cached.maxQuestions,
    survey: cached.survey,
  };
}

/** Calls POST /api/v1/research. */
async function createProject(payload: CreateResearchPayload): Promise<ResearchProject> {
  const raw = await apiFetch<RawResearch>('/api/v1/research', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  studyStore.register(raw.id);
  return toProject(raw);
}

/** Calls GET /api/v1/research/{id}. Returns null when the study does not exist. */
async function getProject(id: number | string): Promise<ResearchProject | null> {
  try {
    const raw = await apiFetch<RawResearch>(`/api/v1/research/${encodeURIComponent(String(id))}`);
    return toProject(raw);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Lists the studies created in this browser. The backend has no list endpoint. */
async function listProjects(): Promise<ResearchProject[]> {
  const projects = await Promise.all(studyStore.listIds().map((id) => getProject(id)));
  return projects.filter((p): p is ResearchProject => p !== null);
}

/** Calls POST /api/v1/llm/research-plan with only the research ID. */
async function generateResearchPlan(payload: GenerateResearchPlanPayload): Promise<ResearchPlan> {
  const plan = await apiFetch<ResearchPlan>('/api/v1/llm/research-plan', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: LLM_TIMEOUT_MS,
  });
  studyStore.update(payload.research_id, { plan });
  return plan;
}

/** Calls POST /api/v1/llm/sessions with only the research ID and question budget. */
async function generateSurvey(payload: GenerateSurveyPayload): Promise<CompiledSurvey> {
  const survey = await apiFetch<CompiledSurvey>('/api/v1/llm/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: LLM_TIMEOUT_MS,
  });
  studyStore.update(payload.research_id, {
    maxQuestions: payload.max_questions,
    survey,
  });
  return survey;
}

export const researchApi = {
  createProject,
  getProject,
  listProjects,
  generateResearchPlan,
  generateSurvey,
};
