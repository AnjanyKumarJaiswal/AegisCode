"use client";

import { useState, useRef, useEffect } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import {
    Target, TrendingUp, CheckCircle,
} from "lucide-react";

interface RiskDataPoint {
    label: string;
    value: number;
}

interface ThreatStats {
    totalScans: number;
    avgRisk: number;
    resolved: number;
}

export default function ThreatHunterPage() {
    const [activeTimeframe, setActiveTimeframe] = useState<"1d" | "7d" | "30d">("7d");
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: 0, label: "" });
    const [riskData, setRiskData] = useState<RiskDataPoint[]>([]);
    const [stats, setStats] = useState<ThreatStats | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [riskRes, statsRes] = await Promise.all([
                    fetch(`/api/v2/risk-data?timeframe=${activeTimeframe}`),
                    fetch("/api/v2/threat-stats"),
                ]);

                if (riskRes.ok) {
                    const data = await riskRes.json();
                    setRiskData(Array.isArray(data) ? data : []);
                }

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch threat data:", err);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, [activeTimeframe]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || riskData.length === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        const index = Math.round((x / width) * (riskData.length - 1));
        const point = riskData[index];

        if (point) {
            const xPos = (index / (riskData.length - 1)) * 100;
            const yPos = 100 - (point.value * 10);

            setTooltip({
                show: true,
                x: xPos,
                y: yPos,
                value: point.value,
                label: point.label
            });
        }
    };

    const pathData = riskData.map((p, i) => {
        const x = (i / (riskData.length - 1)) * 1000;
        const y = 200 - (p.value * 20);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');

    const areaData = `${pathData} L1000,200 L0,200 Z`;

    return (
        <DashboardShell>
            <div className="content-inner">
                <div className="mb-10">
                    <h1 className="text-xl font-bold text-[#F5F2EE] mb-2">Security Posture Analysis</h1>
                    <p className="text-[10px] font-mono text-[#4A4440] uppercase tracking-[0.2em]">
                        Real-time threat evaluation & system vulnerability indexing
                    </p>
                </div>

                <div className="card !p-10 mb-8 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <h2 className="text-lg font-bold text-[#F5F2EE] tracking-wide mb-1">AGGREGATE RISK SCORE</h2>
                            <p className="text-[10px] font-mono text-[#C4701F] uppercase tracking-widest animate-pulse">
                                Live tracking active
                            </p>
                        </div>
                        <div className="flex bg-[#0E0D0C] border border-[#2E2A26] rounded-sm p-1">
                            {(["1d", "7d", "30d"] as const).map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setActiveTimeframe(tf)}
                                    className={`px-4 py-1 text-[10px] font-mono font-bold transition-colors rounded-sm ${
                                        activeTimeframe === tf
                                            ? 'text-[#F5F2EE] bg-[#1A1714]'
                                            : 'text-[#4A4440] hover:text-[#A89F94]'
                                    }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex flex-col justify-between h-64 text-[9px] font-mono text-[#4A4440] pt-1 pb-1">
                            <span>10.0</span>
                            <span>7.5</span>
                            <span>5.0</span>
                            <span>2.5</span>
                            <span>0.0</span>
                        </div>

                        <div
                            ref={containerRef}
                            className="relative h-64 flex-1 cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseEnter={() => setTooltip(prev => ({ ...prev, show: true }))}
                            onMouseLeave={() => setTooltip(prev => ({ ...prev, show: false }))}
                        >
                            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                                <div className="w-full border-t border-dashed border-[#4A4440]" />
                                <div className="w-full border-t border-dashed border-[#4A4440]" />
                                <div className="w-full border-t border-dashed border-[#4A4440]" />
                                <div className="w-full border-t border-dashed border-[#4A4440]" />
                                <div className="w-full border-t border-dashed border-[#4A4440]" />
                            </div>

                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke="#C4701F"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    className="transition-all duration-500 ease-in-out"
                                />
                                <path
                                    d={areaData}
                                    fill="url(#graphGradient)"
                                    opacity="0.1"
                                    className="transition-all duration-500 ease-in-out"
                                />
                                <defs>
                                    <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#C4701F" />
                                        <stop offset="100%" stopColor="transparent" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div
                                className={`absolute bg-[#1A1714] border border-[#2E2A26] p-3 rounded-sm shadow-2xl z-10 transition-all duration-100 pointer-events-none ${tooltip.show ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    left: `${tooltip.x}%`,
                                    top: `${tooltip.y}%`,
                                    transform: 'translate(-50%, -120%)'
                                }}
                            >
                                <div className="w-2 h-2 rounded-full bg-[#C4701F] absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 border-r border-b border-[#2E2A26]" />
                                <p className="text-[10px] font-bold text-[#C4701F] mb-0.5 uppercase tracking-widest whitespace-nowrap">
                                    Risk Score: {tooltip.value}
                                </p>
                                <p className="text-[8px] font-mono text-[#4A4440] uppercase">
                                    {activeTimeframe === '1d' ? 'Time' : 'Session'} {tooltip.label.replace('S', '')} - {new Date().getHours()}:00Z
                                </p>
                            </div>

                            <div
                                className={`absolute top-0 bottom-0 w-px bg-[#C4701F]/20 pointer-events-none transition-opacity duration-200 ${tooltip.show ? 'opacity-100' : 'opacity-0'}`}
                                style={{ left: `${tooltip.x}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between mt-8 pl-12 pr-0 text-[10px] font-mono text-[#4A4440] uppercase tracking-widest">
                        {riskData.map(p => <span key={p.label}>{p.label}</span>)}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="card flex flex-col justify-between h-48 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono text-[#4A4440] uppercase tracking-[0.2em]">Total Scans</p>
                            <div className="w-10 h-10 bg-[#0E0D0C] border border-[#2E2A26] flex items-center justify-center rounded-sm text-[#C4701F]/50 group-hover:text-[#C4701F] transition-colors">
                                <Target size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-5xl font-bold text-[#F5F2EE]">{loading ? "—" : stats?.totalScans ?? 0}</span>
                        </div>
                    </div>

                    <div className="card flex flex-col justify-between h-48 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono text-[#4A4440] uppercase tracking-[0.2em]">Avg Risk This Week</p>
                            <div className="w-10 h-10 bg-[#0E0D0C] border border-[#2E2A26] flex items-center justify-center rounded-sm text-[#C4701F]/50 group-hover:text-[#C4701F] transition-colors">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-5xl font-bold text-[#F5F2EE]">{loading ? "—" : stats?.avgRisk ?? 0}</span>
                        </div>
                    </div>

                    <div className="card flex flex-col justify-between h-48 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono text-[#4A4440] uppercase tracking-[0.2em]">Vulnerabilities Resolved</p>
                            <div className="w-10 h-10 bg-[#0E0D0C] border border-[#2E2A26] flex items-center justify-center rounded-sm text-[#C4701F]/50 group-hover:text-[#C4701F] transition-colors">
                                <CheckCircle size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-5xl font-bold text-[#F5F2EE]">{loading ? "—" : stats?.resolved ?? 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}