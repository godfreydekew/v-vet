/**
 * Users service — all user CRUD API calls live here.
 * Field names mirror the backend UserPublic / UserCreate / UserUpdateMe schemas exactly.
 */
import { api } from '@/lib/api';
import type { User } from '@/contexts/AuthContext';

// ---------------------------------------------------------------------------
// Payload types (mirror backend schemas)
// ---------------------------------------------------------------------------

export interface UserCreatePayload {
  email: string;
  password: string;
  full_name?: string | null;
  role: 'farmer' | 'vet' | 'admin';
  phone_number?: string | null;
  address?: string | null;
}

export interface UserUpdateMePayload {
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface BroadcastEmailPayload {
  subject: string;
  message: string;
}

export interface UsersListResponse {
  data: User[];
  count: number;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** Superuser — list all users (paginated). */
export async function fetchUsers(params?: { skip?: number; limit?: number }): Promise<UsersListResponse> {
  const { data } = await api.get<UsersListResponse>('/users/', { params });
  return data;
}

/** Superuser — create a new user with any role. */
export async function registerUser(payload: UserCreatePayload): Promise<User> {
  const { data } = await api.post<User>('/users/', payload);
  return data;
}

/** Update the currently authenticated user's own profile. */
export async function updateCurrentUser(payload: UserUpdateMePayload): Promise<User> {
  const { data } = await api.patch<User>('/users/me', payload);
  return data;
}

/** Change the currently authenticated user's password. */
export async function updatePassword(payload: UpdatePasswordPayload): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>('/users/me/password', payload);
  return data;
}

/** Delete the currently authenticated user's own account. */
export async function deleteCurrentUser(): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>('/users/me');
  return data;
}

/** Superuser — delete any user by ID. */
export async function deleteUserById(userId: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/users/${userId}`);
  return data;
}

/** Superuser — update any user by ID. */
export async function updateUserById(userId: string, payload: Partial<UserCreatePayload>): Promise<User> {
  const { data } = await api.patch<User>(`/users/${userId}`, payload);
  return data;
}

/** Any authenticated user — list all active vets (for vet picker). */
export async function fetchVets(): Promise<UsersListResponse> {
  const { data } = await api.get<UsersListResponse>('/users/vets');
  return data;
}

/** Superuser — send broadcast email to all active users. */
export async function sendBroadcastEmail(payload: BroadcastEmailPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/utils/broadcast-email/', payload);
  return data;
}
