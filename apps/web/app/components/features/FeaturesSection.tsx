import "./features.css";

const VULN_TAGS = [
    "SQL Injection",
    "Hardcoded Secrets",
    "Reflected XSS",
    "Insecure Deserialization",
    "Broken Auth",
    "SSRF",
    "Path Traversal",
    "Sensitive Data Exposure",
    "OWASP Top 10",
    "CVE Pattern Matching",
] as const;

export default function FeaturesSection() {
    return (
        <section className="features" id="how-it-works" aria-label="How It Works">
            <div className="features-inner">

                {/* Section label */}
                <div className="features-label">
                    <div className="features-pill">
                        <span className="features-pill-text">The Scanning Pipeline</span>
                    </div>
                </div>

                {/* Section headline */}
                <div className="features-headline">
                    <span className="features-headline-line">Catch What Your AI Agent</span>
                    <span className="features-headline-line gradient">Was Never Built To Catch.</span>
                </div>

                {/* Three-column grid — 1px gap is the divider */}
                <div className="features-grid">

                    {/* Column 1 — Session Tracking */}
                    <div className="features-col">
                        <span className="col-index">01</span>
                        <h3 className="col-title">Session Tracking</h3>
                        <div className="mini-terminal" aria-label="Session state">
                            <span className="mini-terminal-line">
                                <span className="t-key">session     →  </span>
                                <span className="t-val">watching 3 files</span>
                            </span>
                            <span className="mini-terminal-line">
                                <span className="t-key">last change →  </span>
                                <span className="t-val">14s ago</span>
                            </span>
                        </div>
                        <p className="col-body">
                            A scan session initialises the moment you start coding. AegisCode
                            monitors file changes in real time, queuing each saved diff for
                            review. Sessions close automatically on inactivity — no manual
                            trigger required.
                        </p>
                        <div className="col-status">
                            <div className="col-status-dot" style={{ backgroundColor: "#7A9970" }} />
                            <span className="col-status-text">Active during coding session</span>
                        </div>
                    </div>

                    {/* Column 2 — Dual-Agent Analysis */}
                    <div className="features-col">
                        <span className="col-index">02</span>
                        <h3 className="col-title">Dual-Agent Analysis</h3>
                        <div className="mini-terminal" aria-label="Agent architecture">
                            <span className="mini-terminal-line">
                                <span className="t-key">agent-1  →  </span>
                                <span className="t-val">initial scan</span>
                            </span>
                            <span className="mini-terminal-line">
                                <span className="t-key">agent-2  →  </span>
                                <span className="t-val">adversarial review</span>
                            </span>
                        </div>
                        <p className="col-body">
                            Two models from different providers run in adversarial mode — one
                            scans for vulnerabilities, the other challenges every finding.
                            Different training data means different blind spots. Together they
                            catch what either alone would miss.
                        </p>
                        <div className="col-status">
                            <div className="col-status-dot" style={{ backgroundColor: "#C4701F" }} />
                            <span className="col-status-text">Running during scan cycle</span>
                        </div>
                    </div>

                    {/* Column 3 — Score-Driven Iteration */}
                    <div className="features-col">
                        <span className="col-index">03</span>
                        <h3 className="col-title">Score-Driven Iteration</h3>
                        <div className="mini-terminal" aria-label="Score trace">
                            <span className="mini-terminal-line">
                                <span className="t-key">iteration 1   </span>
                                <span className="t-val">risk: 8.4</span>
                            </span>
                            <span className="mini-terminal-line">
                                <span className="t-key">iteration 3   </span>
                                <span className="t-val">risk: </span>
                                <span className="t-score-grad">2.1</span>
                            </span>
                        </div>
                        <p className="col-body">
                            The scan report is injected directly into the AI agent&apos;s context.
                            Fixes are applied, and AegisCode re-scans. This loop repeats until
                            the risk score clears the configured threshold — or flags for human
                            review.
                        </p>
                        <div className="col-status">
                            <div className="col-status-dot" style={{ backgroundColor: "#C9A84C" }} />
                            <span className="col-status-text">Iterates until risk clears</span>
                        </div>
                    </div>

                </div>

                {/* Vulnerability tag strip */}
                <div className="vuln-strip-section">
                    <span className="vuln-strip-label">Evaluated Against</span>
                    <div className="vuln-strip-wrapper">
                        <div className="vuln-strip-track">
                            {[...VULN_TAGS, ...VULN_TAGS].map((tag, i) => (
                                <span key={`${tag}-${i}`} className="vuln-tag">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom separator */}
            <div className="features-separator" aria-hidden="true" />
        </section>
    );
}
