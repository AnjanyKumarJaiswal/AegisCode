"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isTokenExpired } from "@aegiscode/shared";
import { useAuth } from "../../context/AuthContext";
import { beginIdeHandoff, isIdeAuthCallbackUri } from "../../utils/ideRedirect";

export default function AuthCallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get("token");
    const source = params.get("source");
    const redirectUri = params.get("redirect_uri");

    if (!token) {
      router.replace("/sign-in?error=missing_token");
      return;
    }

    if (isTokenExpired(token)) {
      router.replace("/sign-in?error=expired_token");
      return;
    }

    if (redirectUri && isIdeAuthCallbackUri(redirectUri)) {
      void loginWithToken(token);
      beginIdeHandoff(redirectUri, token);
      return;
    }

    if (source === "vscode") {
      void loginWithToken(token);
      beginIdeHandoff(
        `vscode://aegiscode.aegiscode/auth/callback`,
        token,
      );
      return;
    }

    loginWithToken(token)
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        router.replace("/sign-in?error=auth_failed");
      });
  }, [params, router, loginWithToken]);

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
