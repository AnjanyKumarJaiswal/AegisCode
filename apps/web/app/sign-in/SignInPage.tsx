"use client";

import { useEffect, useRef, useState } from "react";
import "./signin.css";

const BOOT_LINES = [
    { text: "aegis  v1.0.0", isReady: false },
    { text: "initializing security context...", isReady: false },
    { text: "loading credential layer...", isReady: false },
    { text: "ready.", isReady: true },
];

export default function SignInPage() {
    const [phase, setPhase] = useState<"boot" | "fading" | "form">("boot");
    const [showBoot, setShowBoot] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    // Boot sequence — sessionStorage guards against re-playing on route navigation
    useEffect(() => {
        if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("aegis_booted")) {
            setPhase("form");
            return;
        }
        sessionStorage.setItem("aegis_booted", "1");
        setShowBoot(true);

        // After all 4 lines + 300ms pause (600ms lines + 300ms = 900ms), start fade-out
        const t1 = setTimeout(() => setPhase("fading"), 900);
        // After fade-out (400ms), show form
        const t2 = setTimeout(() => setPhase("form"), 1300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate auth — replace with real logic
        setTimeout(() => setLoading(false), 1800);
    };

    const isForm = phase === "form";

    return (
        <div className="signin-page">

            {/* Boot sequence */}
            {showBoot && phase !== "form" && (
                <div className={`boot-sequence${phase === "fading" ? " fading" : ""}`} aria-live="polite">
                    {BOOT_LINES.map((line) => (
                        <span key={line.text} className={`boot-line${line.isReady ? " boot-line--ready" : ""}`}>
                            {line.text}
                        </span>
                    ))}
                </div>
            )}

            {/* Sign-in form */}
            <div className={`signin-form-wrap${isForm ? " visible" : ""}`} aria-hidden={!isForm}>
                {/* Wordmark */}
                <div className="signin-wordmark-block">
                    <span className="signin-wordmark">AegisCode</span>
                    <span className="signin-descriptor">security guardian</span>
                </div>
                <div className="signin-rule" aria-hidden="true" />

                {/* Headline */}
                <h1 className="signin-headline">Access your workspace.</h1>
                <p className="signin-sub">Sign in to continue to AegisCode.</p>

                {/* Form */}
                <form className="signin-form" onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className="field-group">
                        <label className="field-label" htmlFor="email">Email address</label>
                        <div className="field-input-wrap">
                            <input
                                id="email"
                                type="email"
                                className="field-input"
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="field-group">
                        <label className="field-label" htmlFor="password">Password</label>
                        <div className="field-input-wrap">
                            <input
                                id="password"
                                type={showPw ? "text" : "password"}
                                className="field-input has-toggle"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className={`pw-toggle${showPw ? " active" : ""}`}
                                onClick={() => setShowPw((v) => !v)}
                                aria-label={showPw ? "Hide password" : "Show password"}
                            >
                                {showPw ? "hide" : "show"}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="signin-submit-wrap">
                        <button type="submit" className="signin-submit" disabled={loading} aria-label="Continue">
                            {loading ? (
                                <>
                                    <span className="dot-1">.</span>
                                    <span className="dot-2">.</span>
                                    <span className="dot-3">.</span>
                                </>
                            ) : "Continue"}
                        </button>
                    </div>
                </form>

                {/* Secondary */}
                <p className="signin-secondary">
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => { }}>Request access</button>
                </p>
            </div>

            {/* Footer watermark */}
            <footer className="signin-footer" aria-hidden="true">
                AegisCode · Secured by dual-agent scanning
            </footer>
        </div>
    );
}
