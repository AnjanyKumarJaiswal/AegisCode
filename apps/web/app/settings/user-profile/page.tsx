"use client";

import { useState, useEffect } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Link from "next/link";
import { User, ChevronLeft, Clock, Zap, Settings } from "lucide-react";

interface UserProfile {
  name: string;
  username: string;
  email: string;
  tier: string;
  todayScans: number;
  usage: number;
  region: string;
}

export default function UserProfilePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v2/settings/user-profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchProfile();
  }, []);

  return (
    <DashboardShell>
      <div className="content-inner !max-w-[800px]">
        <div className="flex justify-between items-end mb-10">
          <div>
            <Link
              href="/settings"
              className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440] hover:text-[#C4701F] uppercase tracking-widest transition-colors mb-6"
            >
              <ChevronLeft size={14} />
              Back to Configuration
            </Link>
            <h1 className="text-5xl font-serif text-[#F5F2EE]">
              Operator Identity
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <div className="px-4 py-2 bg-[#141210] border border-[#2E2A26] rounded-sm flex items-center gap-3">
              <Clock size={12} className="text-[#C4701F]" />
              <span className="text-[14px] font-mono text-[#F5F2EE] tracking-widest">
                {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
              </span>
            </div>
            <span className="text-[8px] font-mono text-[#4A4440] uppercase tracking-widest mt-2">
              Node_01 // Global Sync
            </span>
          </div>
        </div>

        <div className="bg-[#141210] border border-[#2E2A26] rounded-sm overflow-hidden">
          <div className="p-12 border-b border-[#2E2A26]">
            <div className="flex gap-12 items-start">
              <div className="w-32 h-32 bg-[#0E0D0C] border border-[#2E2A26] rounded-sm flex items-center justify-center shrink-0">
                <User size={56} className="text-[#2E2A26]" />
              </div>

              <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-8">
                <div>
                  <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-1">
                    Operator Name
                  </p>
                  <p className="text-xl font-serif text-[#F5F2EE]">
                    {loading ? "—" : (profile?.name ?? "—")}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-1">
                    Designated Username
                  </p>
                  <p className="text-sm font-mono text-[#C4701F]">
                    {loading ? "—" : (profile?.username ?? "—")}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-1">
                    Email Protocol
                  </p>
                  <p className="text-sm font-mono text-[#A89F94]">
                    {loading ? "—" : (profile?.email ?? "—")}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-1">
                    Today Scan Activity
                  </p>
                  <p className="text-sm font-mono text-[#F5F2EE] flex items-center gap-2">
                    <Zap size={12} className="text-[#C4701F]" />
                    {loading ? "—" : `${profile?.todayScans ?? 0} Resolved`}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-1">
                    Clearance Level
                  </p>
                  <p className="text-sm font-mono text-[#F5F2EE] uppercase">
                    {loading ? "—" : (profile?.tier ?? "—")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0E0D0C]/50 p-4">
            <Link
              href="/settings/user-profile/edit"
              className="w-full flex items-center justify-center gap-2 py-4 border border-[#2E2A26] text-[10px] font-mono font-bold text-[#4A4440] hover:text-[#F5F2EE] hover:border-[#C4701F] transition-all uppercase tracking-widest group"
            >
              <Settings
                size={12}
                className="group-hover:rotate-45 transition-transform"
              />
              Edit Profile Configuration
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-2">
                AegisCode Usage Allocation
              </p>
              <div className="w-full h-1 bg-[#2E2A26] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C4701F]"
                  style={{ width: `${loading ? 0 : (profile?.usage ?? 0)}%` }}
                />
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-[10px] font-mono text-[#4A4440]">
                  Resource Load: Optimal
                </span>
                <span className="text-[10px] font-mono text-[#4A4440]">
                  Monthly Reset in 12d
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-5xl font-mono text-[#F5F2EE]">
                {loading ? "—" : `${profile?.usage ?? 0}%`}
              </span>
              <p className="text-[10px] font-mono text-[#4A4440] uppercase tracking-widest mt-1">
                Total Consumption
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
