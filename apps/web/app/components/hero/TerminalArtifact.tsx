export default function TerminalArtifact() {
    return (
        <div className="terminal">
            {}
            <div className="terminal-header">
                <div className="terminal-dots">
                    <span className="terminal-dot" />
                    <span className="terminal-dot" />
                    <span className="terminal-dot" />
                </div>
                <span className="terminal-label">aegis — scan session</span>
            </div>

            {}
            <div className="terminal-body">
                <span className="t-line">
                    <span className="t-dim">[session] </span>
                    <span className="t-file">initializing scan · ~/project/src/api/auth.ts</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[scan]    </span>
                    <span className="t-file">loading 2 agents for cross-analysis</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[agent-1] </span>
                    <span className="t-file">auth.ts:47 — </span>
                    <span className="t-vuln">SQL Injection  CRITICAL</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[agent-2] </span>
                    <span className="t-file">auth.ts:12 — </span>
                    <span className="t-vuln">Hardcoded API Secret  HIGH</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[agent-1] </span>
                    <span className="t-file">auth.ts:89 — </span>
                    <span className="t-vuln">Reflected XSS  HIGH</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[scan]    </span>
                    <span className="t-file">checking insecure deserialization...</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[agent-2] </span>
                    <span className="t-pass">CLEAN</span>
                    <span className="t-file"> — no deserialization flaws found</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[scan]    </span>
                    <span className="t-file">iterating patch recommendations...</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[session] </span>
                    <span className="t-score-before">risk score: 8.4 → </span>
                    <span className="t-score-after">2.1</span>
                </span>

                <span className="t-line">
                    <span className="t-dim">[session] </span>
                    <span className="t-pass">report saved</span>
                    <span className="t-file"> · .aegis/scan-2025-03-01.json  </span>
                    <span className="terminal-cursor" aria-hidden="true" />
                </span>
            </div>
        </div>
    );
}
