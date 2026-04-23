"use client";

import { useState, useEffect } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import Link from "next/link";
import {
    User, ChevronLeft,
    Camera, Fingerprint
} from "lucide-react";

interface ProfileFormData {
    name: string;
    email: string;
    role: string;
    bio: string;
}

export default function EditProfilePage() {
    const [formData, setFormData] = useState<ProfileFormData>({
        name: "",
        email: "",
        role: "",
        bio: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/v2/user-profile");
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.name ?? "",
                        email: data.email ?? "",
                        role: data.role ?? "",
                        bio: data.bio ?? ""
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        }

        void fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/v2/user-profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                console.error("Failed to save profile");
            }
        } catch (err) {
            console.error("Failed to save profile:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardShell>
            <div className="content-inner !max-w-[800px]">
                <Link
                    href="/settings/user-profile"
                    className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440] hover:text-[#C4701F] uppercase tracking-widest transition-colors mb-10"
                >
                    <ChevronLeft size={14} />
                    Back to Profile Dashboard
                </Link>

                <div className="mb-12">
                    <h1 className="text-5xl font-serif text-[#F5F2EE] mb-4">Modify Identity</h1>
                    <p className="text-[#A89F94] text-lg leading-relaxed font-light">
                        Update your operational credentials and biometric markers.
                    </p>
                </div>

                <div className="bg-[#141210] border border-[#2E2A26] p-10 rounded-sm">
                    <div className="flex items-center gap-8 mb-12 p-6 bg-[#0E0D0C] border border-[#2E2A26] rounded-sm">
                        <div className="w-16 h-16 bg-[#141210] border border-[#2E2A26] flex items-center justify-center rounded-sm relative group overflow-hidden">
                            <User size={24} className="text-[#2E2A26]" />
                            <div className="absolute inset-0 bg-[#C4701F]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera size={14} className="text-[#F5F2EE]" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold text-[#F5F2EE] uppercase tracking-widest mb-1">Visual Identifier</h4>
                            <p className="text-[10px] font-mono text-[#4A4440] mb-3">Recommended: 400x400px encrypted PNG</p>
                            <button className="text-[9px] font-mono text-[#C4701F] uppercase tracking-widest hover:underline">
                                Upload New Hash
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Operator Codename</p>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-[#0E0D0C] border border-[#2E2A26] p-4 text-[13px] font-mono text-[#F5F2EE] rounded-sm outline-none focus:border-[#C4701F] transition-colors"
                            />
                        </div>

                        <div>
                            <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Secure Email Node</p>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                className="w-full bg-[#0E0D0C] border border-[#2E2A26] p-4 text-[13px] font-mono text-[#F5F2EE] rounded-sm outline-none focus:border-[#C4701F] transition-colors"
                            />
                        </div>

                        <div>
                            <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Assigned Designation</p>
                            <input
                                value={formData.role}
                                onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))}
                                className="w-full bg-[#0E0D0C] border border-[#2E2A26] p-4 text-[13px] font-mono text-[#F5F2EE] rounded-sm outline-none focus:border-[#C4701F] transition-colors"
                            />
                        </div>

                        <div>
                            <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Operational Directive (Bio)</p>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(f => ({ ...f, bio: e.target.value }))}
                                rows={4}
                                className="w-full bg-[#0E0D0C] border border-[#2E2A26] p-4 text-[13px] font-mono text-[#F5F2EE] rounded-sm outline-none focus:border-[#C4701F] transition-colors resize-none leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-[#2E2A26] flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Fingerprint size={14} className="text-[#4A4440]" />
                            <span className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest">Requires Re-auth</span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#C4701F] px-10 py-4 text-[11px] font-mono font-bold text-[#0E0D0C] uppercase tracking-widest hover:bg-[#D4762A] transition-all rounded-sm shadow-lg shadow-[#C4701F]/10 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Commit Identity Update"}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}