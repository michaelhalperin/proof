import { API_URL } from "../config/env";
import { getAuthToken, clearAuthToken } from "./authToken";

/**
 * API utility functions for making HTTP requests.
 * Automatically attaches JWT from secure storage when available.
 * On 401, clears the stored token so the app can show login again.
 */

export interface ApiError {
  error: string;
  message?: string;
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = await getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    await clearAuthToken();
  }
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    const message = error.error || error.message || response.statusText || "Request failed";
    const err = new Error(`${response.status}: ${message}`) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: await getHeaders(),
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: await getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PUT",
    headers: await getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers: await getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });
  return handleResponse<T>(response);
}
