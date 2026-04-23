"use client";

import { useEffect, useState } from "react";
import { Download, AlertTriangle, Activity, ShieldAlert } from "lucide-react";

interface DashboardStats {
    healthScore: number;
    totalScans: number;
    vulnBlocked: number;
    activeThreats: Array<{ severity: string; count: number }>;
}

interface ThreatFeedItem {
    id: string;
    timestamp: string;
    targetAsset: string;
    protocol: string;
    status: string;
    score: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [threatFeed, setThreatFeed] = useState<ThreatFeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, feedRes] = await Promise.all([
                    fetch("/api/v2/stats"),
                    fetch("/api/v2/threat-feed"),
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                if (feedRes.ok) {
                    const feedData = await feedRes.json();
                    setThreatFeed(Array.isArray(feedData) ? feedData : []);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    return (
        <div className="content-inner">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="dash-title m-0">Command Center</h1>
                    <p className="dash-subtitle mt-1">Global Security Posture Overview</p>
                </div>
                <button className="flex items-center gap-2 border border-[#2E2A26] px-4 py-1.5 text-[10px] font-mono text-[#A89F94] hover:text-[#F5F2EE] transition-colors rounded-[2px]">
                    <Download size={14} />
                    Export Report
                </button>
            </div>

            <div className="stats-grid">
                <div className="card">
                    <div className="stat-header">
                        <h3 className="card-title">Global Health Index</h3>
                        <p className="card-subtitle">System Integrity</p>
                    </div>
                    <div className="flex items-baseline mb-4">
                        <span className="stat-value-large">{loading ? "—" : (stats?.healthScore ?? 0)}</span>
                        <span className="stat-unit">/100</span>
                    </div>
                    <div className="w-full h-1 bg-[#1A1714] overflow-hidden">
                        <div
                            className="h-full bg-[#C4701F]"
                            style={{ width: `${loading ? 0 : (stats?.healthScore ?? 0)}%` }}
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="stat-header flex justify-between">
                        <h3 className="card-title">Total Scans</h3>
                        <Activity size={16} className="text-[#4A4440]" />
                    </div>
                    <div className="flex items-end justify-between mt-8">
                        <span className="stat-value-large">{loading ? "—" : (stats?.totalScans ?? 0).toLocaleString()}</span>
                    </div>
                </div>

                <div className="card">
                    <div className="stat-header flex justify-between">
                        <h3 className="card-title">Vuln. Blocked</h3>
                        <ShieldAlert size={16} className="text-[#4A4440]" />
                    </div>
                    <div className="flex items-end justify-between mt-8">
                        <span className="stat-value-large">{loading ? "—" : (stats?.vulnBlocked ?? 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="threats-section">
                <div className="card !bg-[#141210]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={18} className="text-[#D4762A]" />
                            <h2 className="text-xl font-bold tracking-wide m-0">Active Threats</h2>
                        </div>
                        <button className="text-[10px] font-mono text-[#D4762A] hover:text-[#F5F2EE] uppercase tracking-widest">
                            View All Alerts
                        </button>
                    </div>
                    <p className="text-[#4A4440] text-[11px] mb-8 pl-8">Immediate action required on high-severity incidents.</p>

                    <div className="threat-card-container">
                        {loading ? (
                            <div className="text-center py-8 text-[#4A4440] font-mono text-xs">Loading...</div>
                        ) : stats?.activeThreats && stats.activeThreats.length > 0 ? (
                            stats.activeThreats.slice(0, 3).map((threat, idx) => (
                                <div key={idx} className="threat-card-inner">
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="badge-ui border-[#D4762A]/40 text-[#D4762A] bg-[#D4762A]/5">
                                                {threat.severity}
                                            </span>
                                            <span className="text-[10px] font-mono text-[#4A4440]">{threat.count} threats</span>
                                        </div>
                                        <h4 className="text-[14px] font-bold mb-2">{threat.severity} Severity Alert</h4>
                                        <p className="text-[11px] text-[#A89F94] font-mono leading-relaxed">Detected in recent scans</p>
                                    </div>
                                    <button className="investigate-btn">INVESTIGATE</button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-[#4A4440] font-mono text-xs">No active threats</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card mt-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold m-0">Real-Time Threat Feed</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C4701F] animate-pulse" />
                        <span className="text-[10px] font-mono text-[#4A4440] uppercase tracking-widest">Live Updates</span>
                    </div>
                </div>

                <table className="table-ui">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Target Asset</th>
                            <th>Protocol</th>
                            <th className="text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-[#4A4440] font-mono text-xs">Loading...</td>
                            </tr>
                        ) : threatFeed.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-[#4A4440] font-mono text-xs">No threat feed data</td>
                            </tr>
                        ) : (
                            threatFeed.slice(0, 5).map((item) => (
                                <tr key={item.id} className="table-row">
                                    <td className="text-[#A89F94]">{new Date(item.timestamp).toISOString().replace('T', ' ').substring(0, 19)}</td>
                                    <td className="font-bold">{item.targetAsset}</td>
                                    <td className="text-[#4A4440]">{item.protocol.toUpperCase()}</td>
                                    <td className="text-right">
                                        <span className="badge-ui border-[#7A9970]/30 text-[#7A9970] bg-[#7A9970]/5 inline-block min-w-[70px] text-center">
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}