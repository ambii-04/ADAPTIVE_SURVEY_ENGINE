import { getApiBaseUrl } from './apiConfig';

export class ApiError extends Error {
  status?: number;
  url: string;
  data?: unknown;

  constructor(message: string, url: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.url = url;
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

/** Research-plan, survey and insight jobs wait on the agentcab workflow (up to ~5 minutes). */
export const LLM_TIMEOUT_MS = 330000;

async function requestWithTimeout(url: string, options: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError(`Request to ${url} timed out after ${timeoutMs / 1000}s`, url);
    }
    throw new ApiError(error.message || `Network error connecting to ${url}`, url);
  }
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs, ...requestOptions } = options;
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(requestOptions.headers as Record<string, string> || {}),
  };

  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !(requestOptions.body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await requestWithTimeout(
    fullUrl,
    { ...requestOptions, headers },
    timeoutMs
  );

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        errorData = null;
      }
    }
    const detail = errorData && (errorData.detail || errorData.message || errorData.error);
    const message = typeof detail === 'string'
      ? detail
      : detail
      ? JSON.stringify(detail)
      : `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(message, fullUrl, response.status, errorData);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export async function apiFetchBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const response = await requestWithTimeout(fullUrl, {
    ...options,
    headers: {
      'Accept': 'text/csv, application/octet-stream, */*',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to download file (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // not json
    }
    throw new ApiError(errorDetail, fullUrl, response.status);
  }

  return await response.blob();
}
