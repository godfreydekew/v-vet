/**
 * Auth service — all authentication API calls live here.
 * Components and contexts import from this file; they never call `api` directly.
 */
import { api, TOKEN_KEY } from '@/lib/api';
import type { User } from '@/contexts/AuthContext';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/**
 * Exchange email + password for a JWT access token.
 * Stores the token in localStorage on success.
 */
export async function signIn(email: string, password: string): Promise<string> {
  const form = new URLSearchParams({ username: email, password });
  const { data } = await api.post<LoginResponse>('/login/access-token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data.access_token;
}

/**
 * Fetch the currently authenticated user's profile.
 */
export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/users/me');
  return data;
}

/**
 * Clear the stored token (client-side logout only — no server call needed
 * because JWTs are stateless).
 */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}
