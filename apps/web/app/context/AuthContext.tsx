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
  login: (payload: LoginPayload) => Promise<string>;
  register: (payload: RegisterPayload) => Promise<string>;
  loginWithToken: (token: string) => Promise<void>;
  loginWithApiKey: (apiKey: string) => Promise<string>;
  logout: () => Promise<void>;
  githubOAuthUrl: (redirectUri?: string) => string;
  clearError: () => void;
}

function getClient(): AuthApiClient {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
  return new AuthApiClient(baseUrl);
}


async function readStoredToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

async function writeStoredToken(token: string): Promise<void> {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

async function clearStoredToken(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
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
      const stored = await readStoredToken();

      if (!stored || isTokenExpired(stored)) {
        if (stored) await clearStoredToken();
        setState({ user: null, token: null, isLoading: false, error: null });
        return;
      }

      try {
        const user = await getClient().me(stored);
        setState({ user, token: stored, isLoading: false, error: null });
      } catch {
        await clearStoredToken();
        setState({ user: null, token: null, isLoading: false, error: null });
      }
    }

    void restoreSession();
  }, []);

  const persist = useCallback(async (token: string, user: SanitizedUser) => {
    await writeStoredToken(token);
    setState({ user, token, isLoading: false, error: null });
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<string> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const { user, token } = await getClient().login(payload);
        await persist(token, user);
        return token;
      } catch (err) {
        const message = humaniseError(err, "login");
        setState((s) => ({ ...s, isLoading: false, error: message }));
        throw err;
      }
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<string> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const { user, token } = await getClient().register(payload);
        await persist(token, user);
        return token;
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
        await persist(token, user);
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

  const loginWithApiKey = useCallback(
    async (apiKey: string): Promise<string> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const { user, token } = await getClient().loginWithApiKey({ apiKey });
        await persist(token, user);
        return token;
      } catch {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: "Invalid API key. Check your key and try again.",
        }));
        throw new Error("Invalid API key");
      }
    },
    [persist],
  );

  const logout = useCallback(async (): Promise<void> => {
    await clearStoredToken();
    setState({ user: null, token: null, isLoading: false, error: null });
  }, []);

  const githubOAuthUrl = useCallback(
    (redirectUri?: string): string => getClient().githubOAuthUrl(redirectUri),
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
        loginWithApiKey,
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
