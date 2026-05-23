"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildIdeCallbackUrl,
  clearIdeHandoffPending,
  getIdeLabelFromRedirectUri,
  readStoredIdeHandoff,
} from "../../utils/ideRedirect";

export default function IdeHandoffPage() {
  const [ideLabel, setIdeLabel] = useState("your IDE");
  const [targetUri, setTargetUri] = useState<string | null>(null);
  const attempted = useRef(false);

  const openIde = useCallback((uri: string) => {
    window.location.href = uri;
  }, []);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const handoff = readStoredIdeHandoff();
    if (!handoff) {
      clearIdeHandoffPending();
      window.location.replace("/sign-in?error=auth_failed");
      return;
    }

    const uri = buildIdeCallbackUrl(handoff.redirectUri, handoff.token);
    if (!uri) {
      clearIdeHandoffPending();
      window.location.replace("/sign-in?error=invalid_token");
      return;
    }

    setIdeLabel(getIdeLabelFromRedirectUri(handoff.redirectUri));
    setTargetUri(uri);

    const timer = window.setTimeout(() => {
      openIde(uri);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [openIde]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        background: "var(--bg, #080705)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "13px",
          color: "#4A4440",
          letterSpacing: "0.08em",
          margin: 0,
        }}
      >
        returning to {ideLabel}...
      </p>

      {targetUri ? (
        <button
          type="button"
          onClick={() => openIde(targetUri)}
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#0E0D0C",
            background: "#C4701F",
            border: "none",
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          Open {ideLabel}
        </button>
      ) : null}

      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "10px",
          color: "#4A4440",
          maxWidth: "360px",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        If {ideLabel} does not open automatically, click the button above.
      </p>
    </div>
  );
}
