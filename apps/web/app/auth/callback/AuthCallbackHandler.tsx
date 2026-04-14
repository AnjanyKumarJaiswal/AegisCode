"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isTokenExpired } from "@aegiscode/shared";
import { useAuth } from "../../context/AuthContext";

/**
 * Handles the GitHub OAuth redirect from the backend.
 *
 * The backend redirects here after a successful GitHub login:
 *   FRONTEND_BASE_URL/auth/callback?token=<jwt>
 *
 * This component:
 *   1. Reads the token from the URL search params.
 *   2. Runs a local expiry check — rejects immediately if the JWT is expired.
 *   3. Calls loginWithToken(), which validates the token with the backend
 *      and commits it to the AuthContext + localStorage.
 *   4. Redirects to /dashboard on success, or /sign-in with an error param
 *      on failure.
 *
 * The `handled` ref prevents the effect from firing twice in React Strict Mode.
 */
export default function AuthCallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get("token");

    // ── Guard: no token in URL ───────────────────────────────────────────────
    if (!token) {
      router.replace("/sign-in?error=missing_token");
      return;
    }

    // ── Guard: token already expired client-side ─────────────────────────────
    if (isTokenExpired(token)) {
      router.replace("/sign-in?error=expired_token");
      return;
    }

    // ── Validate with backend and persist ────────────────────────────────────
    loginWithToken(token)
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        router.replace("/sign-in?error=auth_failed");
      });
  }, [params, router, loginWithToken]);

  // ── Loading UI ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #080705)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "13px",
          color: "#4A4440",
          letterSpacing: "0.08em",
        }}
      >
        completing sign in...
      </p>
    </div>
  );
}
