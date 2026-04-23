"use client";

import { useEffect, useState } from "react";
import "./bootscreen.css";

type Phase = "idle" | "running" | "exiting" | "done";


let _bootShown = false;

const LINES = [
    { text: "initializing security context...", cursorDelay: "320ms", textDelay: "400ms" },
    { text: "loading credential layer...", cursorDelay: "520ms", textDelay: "600ms" },
    { text: "establishing agent pipeline...", cursorDelay: "720ms", textDelay: "800ms" },
] as const;

export default function Bootscreen() {
    const [phase, setPhase] = useState<Phase>(_bootShown ? "done" : "running");

    useEffect(() => {
        if (_bootShown && phase === "done") { return; }
        _bootShown = true;

        
        const t = setTimeout(() => {
            const startExit = () => {
                setPhase("exiting");
                setTimeout(() => setPhase("done"), 400);
            };
            if (document.readyState === "complete") startExit();
            else window.addEventListener("load", startExit, { once: true });
        }, 1600);

        return () => clearTimeout(t);
    }, []);

    if (phase === "done") return null;

    return (
        <div className={`bootscreen${phase === "exiting" ? " exiting" : ""}`} aria-live="polite">

            {phase === "running" && (
                <div className="bootscreen-center">

                    <div className="boot-identity">
                        <span className="boot-brand">AegisCode</span>
                        <span className="boot-version">v1.0.0</span>
                    </div>

                    {LINES.map(({ text, cursorDelay, textDelay }) => (
                        <div key={text} className="boot-init-line">
                            <span className="boot-cursor-char" style={{ animationDelay: cursorDelay }}>▋</span>
                            <span className="boot-text" style={{ animationDelay: textDelay }}>{text}</span>
                        </div>
                    ))}

                    <div className="boot-rule" style={{ animationDelay: "1000ms" }} />
                    <span className="boot-ready-text" style={{ animationDelay: "1200ms" }}>ready.</span>

                </div>
            )}

            <div className="bootscreen-dots" aria-hidden="true">
                <span className="bootscreen-dot" />
                <span className="bootscreen-dot" />
                <span className="bootscreen-dot" />
            </div>

        </div>
    );
}
