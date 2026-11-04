import { CompiledSurvey, ResearchPlan } from '../types/research';

/**
 * Browser-side cache for study data the backend stores but does not return
 * from GET /api/v1/research/{id}: the research plan, the compiled survey and
 * the question budget. It also remembers which study IDs were created here,
 * because the backend has no list endpoint.
 */

const STORAGE_KEY = 'pm_studio_study_cache';

export interface StudyCacheEntry {
  plan?: ResearchPlan;
  maxQuestions?: number;
  survey?: CompiledSurvey;
}

interface StudyCache {
  studyIds: number[];
  studies: Record<string, StudyCacheEntry>;
}

function readCache(): StudyCache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudyCache;
      return {
        studyIds: Array.isArray(parsed.studyIds) ? parsed.studyIds : [],
        studies: parsed.studies || {},
      };
    }
  } catch {
    // Corrupt or unavailable storage: start with an empty cache.
  }
  return { studyIds: [], studies: {} };
}

function writeCache(cache: StudyCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage unavailable (private mode or quota): the app still works without the cache.
  }
}

export const studyStore = {
  listIds(): number[] {
    return readCache().studyIds;
  },

  register(id: number): void {
    const cache = readCache();
    if (!cache.studyIds.includes(id)) {
      cache.studyIds.push(id);
      writeCache(cache);
    }
  },

  get(id: number | string): StudyCacheEntry {
    return readCache().studies[String(id)] ?? {};
  },

  update(id: number | string, patch: StudyCacheEntry): void {
    const cache = readCache();
    const key = String(id);
    cache.studies[key] = { ...(cache.studies[key] ?? {}), ...patch };
    writeCache(cache);
  },
};
