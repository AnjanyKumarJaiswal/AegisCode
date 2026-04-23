"use client";

import { useState, useEffect } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import Link from "next/link";
import {
    Key, Puzzle, Bell,
    Copy, Eye, EyeOff, RefreshCw, Info, User
} from "lucide-react";

interface Settings {
    projectId: string;
    secretKey: string;
    criticalAlerts: boolean;
    weeklySummary: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        projectId: "",
        secretKey: "",
        criticalAlerts: true,
        weeklySummary: false
    });
    const [showSecret, setShowSecret] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/v2/settings");
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setLoading(false);
            }
        }

        void fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch("/api/v2/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (!res.ok) {
                console.error("Failed to save settings");
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
        }
    };

    return (
        <DashboardShell>
            <div className="content-inner !max-w-[1000px]">
                <div className="mb-12 flex justify-between items-start">
                    <div>
                        <h1 className="text-5xl font-serif text-[#F5F2EE] mb-4">Configuration Protocol</h1>
                        <p className="text-[#A89F94] text-lg leading-relaxed font-light max-w-2xl">
                            Manage system integrations, cryptographic keys, and notification
                            hierarchies to maintain operational security.
                        </p>
                    </div>
                    <Link
                        href="/settings/user-profile"
                        className="flex items-center gap-3 px-6 py-3 border border-[#2E2A26] rounded-sm text-[10px] font-mono font-bold text-[#F5F2EE] uppercase tracking-widest hover:bg-[#1A1714] hover:border-[#C4701F] transition-all group shrink-0"
                    >
                        <User size={14} className="text-[#4A4440] group-hover:text-[#C4701F] transition-colors" />
                        User Profile
                    </Link>
                </div>

                <div className="grid grid-cols-[1fr,300px] gap-8">

                    <div className="flex flex-col gap-8">

                        <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm relative">
                            <div className="absolute top-8 right-8">
                                <span className="text-[9px] font-mono text-[#4A4440] border border-[#2E2A26] px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                    Production
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                <Key size={18} className="text-[#C4701F]" />
                                <h3 className="text-sm font-bold text-[#F5F2EE] uppercase tracking-widest">API Configuration</h3>
                            </div>
                            <p className="text-[11px] font-mono text-[#4A4440] mb-10">Manage your core authentication credentials.</p>

                            <div className="space-y-8">
                                <div>
                                    <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Project ID</p>
                                    <div className="relative group">
                                        <input
                                            value={settings.projectId}
                                            onChange={(e) => setSettings(s => ({ ...s, projectId: e.target.value }))}
                                            placeholder="Enter Project ID"
                                            className="w-full bg-[#0E0D0C] border border-[#2E2A26] p-3 pr-12 text-[12px] font-mono text-[#F5F2EE] placeholder-[#4A4440] rounded-sm outline-none focus:border-[#C4701F] transition-colors"
                                        />
                                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4440] hover:text-[#C4701F] transition-colors">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest">Secret Key</p>
                                        <span className="text-[9px] font-mono text-[#D4762A] uppercase tracking-widest flex items-center gap-1">
                                            ▲ Highly Sensitive
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showSecret ? "text" : "password"}
                                            value={settings.secretKey}
                                            onChange={(e) => setSettings(s => ({ ...s, secretKey: e.target.value }))}
                                            placeholder="Enter Secret Key"
                                            className="w-full bg-[#0E0D0C] border border-[#2E2A26] p-3 pr-12 text-[12px] font-mono text-[#F5F2EE] placeholder-[#4A4440] rounded-sm outline-none focus:border-[#C4701F] transition-colors"
                                        />
                                        <button
                                            onClick={() => setShowSecret(!showSecret)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4440] hover:text-[#C4701F] transition-colors"
                                        >
                                            {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-12">
                                <button className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440] hover:text-[#F5F2EE] uppercase tracking-widest transition-colors">
                                    <RefreshCw size={14} />
                                    Rotate Keys
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-transparent border border-[#2E2A26] px-6 py-3 text-[10px] font-mono font-bold text-[#F5F2EE] uppercase tracking-widest hover:bg-[#1A1714] hover:border-[#C4701F] transition-colors rounded-sm"
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
                            <div className="flex items-center gap-3 mb-10">
                                <Puzzle size={18} className="text-[#A89F94]" />
                                <h3 className="text-sm font-bold text-[#F5F2EE] uppercase tracking-widest">System Integration</h3>
                            </div>

                            <div className="bg-[#0E0D0C] border border-[#2E2A26] p-6 rounded-sm flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-[#141210] border border-[#2E2A26] flex items-center justify-center rounded-sm">
                                        <div className="w-6 h-6 border-2 border-[#4A4440] rounded-sm opacity-50" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#F5F2EE] mb-1">VS Code / Cursor Integration</h4>
                                        <p className="text-[11px] font-mono text-[#4A4440]">Real-time vulnerability scanning in your IDE.</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-[9px] font-mono text-[#7A9970] uppercase tracking-widest mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#7A9970]" />
                                        Connected
                                    </div>
                                    <p className="text-[8px] font-mono text-[#4A4440] uppercase tracking-widest">Last Sync: 2m ago</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm h-full">
                            <div className="flex items-start gap-3 mb-10">
                                <Bell size={18} className="text-[#A89F94] mt-1" />
                                <h3 className="text-sm font-bold text-[#F5F2EE] uppercase tracking-widest leading-tight">Alert Preferences</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-[#0E0D0C] p-6 rounded-sm border border-[#2E2A26]">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-[11px] font-bold text-[#F5F2EE]">Critical Vulnerabilities</h4>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, criticalAlerts: !s.criticalAlerts }))}
                                            className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${settings.criticalAlerts ? 'bg-[#C4701F]' : 'bg-[#2E2A26]'}`}
                                        >
                                            <div className={`absolute top-1 w-2 h-2 bg-[#0E0D0C] rounded-full transition-all ${settings.criticalAlerts ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-mono text-[#4A4440] leading-relaxed">
                                        Immediate SMS and email dispatch for severity level 9.0+ threats.
                                    </p>
                                </div>

                                <div className="bg-[#0E0D0C] p-6 rounded-sm border border-[#2E2A26]">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-[11px] font-bold text-[#F5F2EE]">Weekly Summary</h4>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, weeklySummary: !s.weeklySummary }))}
                                            className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${settings.weeklySummary ? 'bg-[#C4701F]' : 'bg-[#2E2A26]'}`}
                                        >
                                            <div className={`absolute top-1 w-2 h-2 bg-[#0E0D0C] rounded-full transition-all ${settings.weeklySummary ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-mono text-[#4A4440] leading-relaxed">
                                        Aggregated threat intelligence report delivered every Monday.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 p-4 bg-[#C4701F]/5 border border-[#C4701F]/10 rounded-sm">
                                <Info size={14} className="text-[#C4701F] flex-shrink-0" />
                                <p className="text-[9px] font-mono text-[#A89F94] leading-relaxed italic">
                                    Alert routing rules can be overridden per project in the Command Center.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}