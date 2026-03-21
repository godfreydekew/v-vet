/**
 * AuthContext
 *
 * - User type mirrors the backend UserPublic schema exactly (no mapping).
 * - All API calls are delegated to auth.service.ts — no direct axios usage here.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TOKEN_KEY, getApiError } from '@/lib/api';
import { signIn, fetchCurrentUser, clearSession } from '@/lib/services/auth.service';

// ---------------------------------------------------------------------------
// Types — aligned 1:1 with backend UserPublic
// ---------------------------------------------------------------------------

export type UserRole = 'farmer' | 'vet' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  full_name: string | null;
  phone_number: string | null;
  address: string | null;
  created_at: string | null;
}

interface AuthContextType {
  user: User | null;
  /** Exchange email + password for a session. Throws a friendly Error on failure. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Replace the in-memory user (call after a successful profile update). */
  setUser: (user: User) => void;
  /** Re-fetch the current user from the API and refresh state. */
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if a token exists, restore the session by fetching the user
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signIn(email, password);           // stores token in localStorage
      const me = await fetchCurrentUser();     // fetch profile with that token
      setUser(me);
    } catch (err) {
      clearSession();
      throw new Error(getApiError(err));       // friendly message propagated to UI
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await fetchCurrentUser();
    setUser(me);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, setUser, refreshUser, isAuthenticated: !!user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
