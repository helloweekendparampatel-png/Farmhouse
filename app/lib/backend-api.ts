import { parseApiErrorMessage } from './api-errors';
import { emitSessionUnauthorized } from './auth-session-events';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

async function handleResponse<T>(res: Response, sentAuth: boolean): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 && sentAuth) {
      emitSessionUnauthorized();
    }
    throw new Error(parseApiErrorMessage(text, res.statusText || 'Request failed'));
  }
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ accessToken: string; user: any }>(res, false);
}

export type ProfileUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function apiPatchProfile(token: string, body: { email?: string; password?: string }) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return handleResponse<{ accessToken: string; user: ProfileUser }>(res, true);
}

export async function apiGet<T>(path: string, token: string | null) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  return handleResponse<T>(res, !!token);
}

export async function apiPost<T>(path: string, token: string | null, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res, !!token);
}

export async function apiPostForm<T>(path: string, token: string | null, formData: FormData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  return handleResponse<T>(res, !!token);
}

export async function apiPatch<T>(path: string, token: string | null, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res, !!token);
}

export async function apiDelete<T>(path: string, token: string | null) {
  const sentAuth = !!token;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401 && sentAuth) {
    emitSessionUnauthorized();
  }
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(parseApiErrorMessage(text, res.statusText || 'Request failed'));
  }
  return (res.status === 204 ? (null as T) : handleResponse<T>(res, sentAuth)) as T;
}
