/**
 * Agraan-Drishti — Unified Frontend API Configuration & Client
 * Replaces all hardcoded http://localhost:8000 occurrences across the codebase.
 */

export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("agraan_auth_token") || "agraan-emergency-dev-key-2026";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = buildApiUrl(endpoint);
  return fetch(url, options);
}

export async function apiFetchAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = buildApiUrl(endpoint);
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}
