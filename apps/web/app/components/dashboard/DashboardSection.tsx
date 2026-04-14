"use client";

import { useRef, useState } from "react";
import "./dashboard.css";


const DATA = [
    { session: "S1", score: 8.4 },
    { session: "S2", score: 7.2 },
    { session: "S3", score: 6.8 },
    { session: "S4", score: 5.3 },
    { session: "S5", score: 4.6 },
    { session: "S6", score: 3.9 },
    { session: "S7", score: 2.8 },
    { session: "S8", score: 2.1 },
];

const VW = 560, VH = 160, PAD_X = 10, PAD_Y = 10;
const UW = VW - PAD_X * 2, UH = VH - PAD_Y * 2;

const pts = DATA.map((d, i) => ({
    x: PAD_X + (i / (DATA.length - 1)) * UW,
    y: PAD_Y + ((10 - d.score) / 10) * UH,
    ...d,
}));

function buildPath(points: typeof pts): string {
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const cp1x = (points[i].x + dx * 0.4).toFixed(1);
        const cp1y = points[i].y.toFixed(1);
        const cp2x = (points[i + 1].x - dx * 0.4).toFixed(1);
        const cp2y = points[i + 1].y.toFixed(1);
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x.toFixed(1)} ${points[i + 1].y.toFixed(1)}`;
    }
    return d;
}

const linePath = buildPath(pts);
const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${VH - PAD_Y} L ${pts[0].x} ${VH - PAD_Y} Z`;
const threshold = PAD_Y + ((10 - 5) / 10) * UH;

const VULNS = [
    { file: "auth.ts:47", name: "SQL Injection", sev: "CRITICAL", sevCls: "vuln-severity--critical", rowCls: "vuln-row--critical" },
    { file: "api/user.ts:12", name: "Hardcoded Secret", sev: "CRITICAL", sevCls: "vuln-severity--critical", rowCls: "vuln-row--critical" },
    { file: "routes/upload.ts:89", name: "Path Traversal", sev: "HIGH", sevCls: "vuln-severity--high", rowCls: "" },
    { file: "middleware/auth.ts:33", name: "Broken Auth", sev: "HIGH", sevCls: "vuln-severity--high", rowCls: "" },
    { file: "utils/parse.ts:61", name: "Reflected XSS", sev: "MEDIUM", sevCls: "vuln-severity--medium", rowCls: "" },
] as const;

type Period = "7d" | "30d";

export default function DashboardSection() {
    const [period, setPeriod] = useState<Period>("7d");
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const svgX = ((e.clientX - rect.left) / rect.width) * VW;
        let nearest = 0, minDx = Infinity;
        pts.forEach((p, i) => { const d = Math.abs(p.x - svgX); if (d < minDx) { minDx = d; nearest = i; } });
        setHoverIdx(nearest);
    };

    const hoverPt = hoverIdx !== null ? pts[hoverIdx] : null;

    return (
        <section className="dashboard" id="dashboard" aria-label="Dashboard">
            <div className="dashboard-inner">

                <div className="dash-label">
                    <div className="dash-pill"><span className="dash-pill-text">Security Intelligence</span></div>
                </div>
                <div className="dash-headline">
                    <span className="dash-headline-line">Every Scan. Every Score.</span>
                    <span className="dash-headline-line gradient">Every Vulnerability. Recorded.</span>
                </div>
                <p className="dash-subtext">
                    Track how your codebase security evolves across sessions, agents, and iterations.
                </p>

                <div className="dash-panels">

                    <div className="dash-panel">
                        <div className="panel-header">
                            <span className="panel-label">Session Score History</span>
                            <div className="time-selector">
                                {(["7d", "30d"] as Period[]).map((p) => (
                                    <button key={p} className={`time-option${period === p ? " active" : ""}`} onClick={() => setPeriod(p)} type="button">{p}</button>
                                ))}
                            </div>
                        </div>

                        <div className="chart-wrap" onMouseLeave={() => setHoverIdx(null)}>
                            <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} className="chart-svg" onMouseMove={onSvgMouseMove} aria-label="Risk score history">
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
                                        <stop offset="0%" stopColor="#D47C2F" />
                                        <stop offset="55%" stopColor="#C9A84C" />
                                        <stop offset="100%" stopColor="#7A9970" />
                                    </linearGradient>
                                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.035" />
                                        <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                <path d={areaPath} fill="url(#areaGrad)" />

                                <line x1={PAD_X} y1={threshold} x2={VW - PAD_X} y2={threshold}
                                    stroke="#2E2A26" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={VW - PAD_X + 4} y={threshold + 4} fontSize="9" fill="#3A3532" fontFamily="var(--font-sans)">threshold</text>

                                <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                                {pts.map((p) => (
                                    <text key={p.session} x={p.x} y={VH + 2} textAnchor="middle" fontSize="10" fill="#3A3532" fontFamily="var(--font-sans)">{p.session}</text>
                                ))}

                                {hoverPt && (
                                    <>
                                        <line x1={hoverPt.x} y1={PAD_Y} x2={hoverPt.x} y2={VH - PAD_Y} stroke="#2E2A26" strokeWidth="1" />
                                        <circle cx={hoverPt.x} cy={hoverPt.y} r="3" fill="#C9A84C" />
                                    </>
                                )}
                            </svg>

                            {hoverPt && (
                                <div className="chart-tooltip" style={{ left: `${(hoverPt.x / VW) * 100}%`, top: `${(hoverPt.y / VH) * 100}%`, transform: "translate(-50%, -130%)" }}>
                                    <span className="chart-tooltip-text">{hoverPt.session} · {hoverPt.score}</span>
                                </div>
                            )}
                        </div>

                        <div className="chart-stats">
                            <div className="stat-block">
                                <span className="stat-number">48</span>
                                <span className="stat-label">Total Scans</span>
                            </div>
                            <div className="stat-sep" />
                            <div className="stat-block">
                                <span className="stat-number">3.4</span>
                                <span className="stat-label">Avg Risk This Week</span>
                            </div>
                            <div className="stat-sep" />
                            <div className="stat-block">
                                <span className="stat-number">127</span>
                                <span className="stat-label">Vulnerabilities Resolved</span>
                            </div>
                        </div>
                    </div>

                    <div className="dash-panel">
                        <div className="panel-header">
                            <span className="panel-label">Recent Findings</span>
                        </div>
                        <div className="vuln-list">
                            {VULNS.map((v) => (
                                <div key={`${v.file}-${v.name}`} className={`vuln-row ${v.rowCls}`}>
                                    <span className="vuln-file">{v.file}</span>
                                    <span className="vuln-name">{v.name}</span>
                                    <span className={`vuln-severity ${v.sevCls}`}>{v.sev}</span>
                                </div>
                            ))}
                        </div>
                        <button className="panel-view-link" type="button">View full report</button>
                    </div>

                </div>

                <div className="dash-callout">
                    <div className="callout-text-wrap">
                        <span className="callout-statement">Security posture improves with every iteration.</span>
                        <span className="callout-sub">AegisCode records the delta between your first scan and final clean state.</span>
                    </div>
                    <div className="callout-metric">
                        <span className="callout-metric-num">74%</span>
                        <div className="callout-metric-label">
                            <span>average score</span>
                            <span>improvement</span>
                        </div>
                    </div>
                </div>

            </div>
            <div className="dash-separator" aria-hidden="true" />
        </section>
    );
}
