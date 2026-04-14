"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  AuthApiClient,
  AuthApiError,
  isTokenExpired,
  type SanitizedUser,
  type LoginPayload,
  type RegisterPayload,
} from "@aegiscode/shared";

interface AuthState {
  user: SanitizedUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  githubOAuthUrl: () => string;
  clearError: () => void;
}

const TOKEN_KEY = "aegiscode.token";

function getClient(): AuthApiClient {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
  return new AuthApiClient(baseUrl);
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function humaniseError(err: unknown, context: "login" | "register"): string {
  if (err instanceof AuthApiError) {
    if (context === "login" && err.status === 401) {
      return "Invalid email or password.";
    }
    if (context === "register" && err.status === 409) {
      return "An account with this email already exists.";
    }
    return err.message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function restoreSession() {
      const stored = readStoredToken();

      if (!stored || isTokenExpired(stored)) {
        if (stored) localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, isLoading: false, error: null });
        return;
      }

      try {
        const user = await getClient().me(stored);
        setState({ user, token: stored, isLoading: false, error: null });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, isLoading: false, error: null });
      }
    }

    void restoreSession();
  }, []);

  const persist = useCallback((token: string, user: SanitizedUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, isLoading: false, error: null });
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<void> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const { user, token } = await getClient().login(payload);
        persist(token, user);
      } catch (err) {
        const message = humaniseError(err, "login");
        setState((s) => ({ ...s, isLoading: false, error: message }));
        throw err;
      }
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<void> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const { user, token } = await getClient().register(payload);
        persist(token, user);
      } catch (err) {
        const message = humaniseError(err, "register");
        setState((s) => ({ ...s, isLoading: false, error: message }));
        throw err;
      }
    },
    [persist],
  );

  const loginWithToken = useCallback(
    async (token: string): Promise<void> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const user = await getClient().me(token);
        persist(token, user);
      } catch (err) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: "Failed to verify token. Please try signing in again.",
        }));
        throw err;
      }
    },
    [persist],
  );

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, isLoading: false, error: null });
  }, []);

  const githubOAuthUrl = useCallback(
    (): string => getClient().githubOAuthUrl(),
    [],
  );

  const clearError = useCallback((): void => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithToken,
        logout,
        githubOAuthUrl,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth() must be called inside an <AuthProvider>. " +
        "Make sure <AuthProvider> wraps your application in layout.tsx.",
    );
  }
  return ctx;
}
