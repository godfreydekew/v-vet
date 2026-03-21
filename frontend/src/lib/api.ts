import axios from 'axios';

export const TOKEN_KEY = 'vvet_token';

export const api = axios.create({
  baseURL: '/api/v1',
});

// Attach stored JWT on every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token so the app returns to unauthenticated state
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem(TOKEN_KEY);
    return Promise.reject(err);
  }
);

// ---------------------------------------------------------------------------
// Friendly error messages — maps known backend detail strings to polite copy
// ---------------------------------------------------------------------------
const FRIENDLY: [RegExp, string][] = [
  [/incorrect email or password/i, "Those details don't match. Please check your email and password and try again."],
  [/inactive user/i,               "Your account is currently inactive. Please contact support for help."],
  [/already exists/i,              "An account with this email already exists. Try signing in instead."],
  [/invalid token/i,               "This link has expired. Please request a new one."],
  [/not found/i,                   "We couldn't find what you're looking for."],
  [/not enough privileges/i,       "You don't have permission to do that."],
  [/super users are not allowed/i, "Superuser accounts cannot be deleted here. Contact your system administrator."],
  [/same as the current/i,         "Your new password must be different from the current one."],
];

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;

    if (typeof detail === 'string') {
      for (const [pattern, friendly] of FRIENDLY) {
        if (pattern.test(detail)) return friendly;
      }
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail.map((d) => (typeof d === 'object' ? d.msg ?? JSON.stringify(d) : String(d))).join(', ');
    }

    if (err.message) return err.message;
  }
  return 'Something went wrong. Please try again.';
}
