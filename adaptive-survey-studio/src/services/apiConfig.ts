export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const STORAGE_KEY_API_URL = 'pm_studio_api_base_url';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_API_BASE_URL;
  return localStorage.getItem(STORAGE_KEY_API_URL) || DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
}
