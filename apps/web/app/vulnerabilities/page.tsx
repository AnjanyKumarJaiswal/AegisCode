"use client";

import { useState, useEffect } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronRight,
  ArrowDown,
  Folder,
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
} from "lucide-react";

interface Finding {
  id: string;
  title: string;
  path: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  detected: string;
  status: "OPEN" | "FIXED";
}

export default function VulnerabilitiesPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchFindings() {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (severityFilter !== "all") params.set("severity", severityFilter);

        const res = await fetch(`/api/v2/vulnerabilities?${params.toString()}`);

        if (res.ok) {
          const data = await res.json();
          setFindings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch findings:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchFindings();
  }, [searchQuery, severityFilter]);

  return (
    <DashboardShell>
      <div className="content-inner">
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="dash-title !text-5xl !font-bold mb-2">
              Active Findings
            </h1>
            <p className="text-[#4A4440] font-mono text-xs uppercase tracking-widest">
              {loading ? "—" : findings.length} Total Vulnerabilities Detected
              Across Infrastructure
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4440]"
                />
                <input
                  type="text"
                  placeholder="Search paths, CVEs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141210] border border-[#2E2A26] rounded-sm py-2 pl-10 pr-4 text-[11px] font-mono text-[#F5F2EE] outline-none w-64 focus:border-[#C4701F]/50 transition-colors"
                />
              </div>
              <button
                onClick={() =>
                  setSeverityFilter(
                    severityFilter === "all"
                      ? "CRITICAL"
                      : severityFilter === "CRITICAL"
                        ? "HIGH"
                        : severityFilter === "HIGH"
                          ? "MEDIUM"
                          : "all",
                  )
                }
                className="flex items-center gap-2 bg-[#1A1714] border border-[#2E2A26] px-4 py-2 text-[11px] font-mono text-[#A89F94] hover:text-[#F5F2EE] transition-colors rounded-sm"
              >
                <Filter size={14} />
                {severityFilter === "all" ? "Severity" : severityFilter}
              </button>
            </div>
            <button className="flex items-center gap-2 bg-[#1A1714] border border-[#2E2A26] px-4 py-2 text-[11px] font-mono text-[#A89F94] hover:text-[#F5F2EE] transition-colors rounded-sm self-start">
              Status
            </button>
          </div>
        </div>

        <div className="flex items-center px-8 mb-6 text-[10px] font-mono text-[#4A4440] uppercase tracking-[0.2em]">
          <div className="w-[15%]">Severity</div>
          <div className="w-[45%]">Vulnerability / Path</div>
          <div className="w-[20%] text-right">Detected</div>
          <div className="w-[20%] text-right">Status</div>
        </div>

        <div className="flex flex-col gap-1">
          {loading ? (
            <div className="text-center py-12 text-[#4A4440] font-mono text-xs">
              Loading...
            </div>
          ) : findings.length === 0 ? (
            <div className="text-center py-12 text-[#4A4440] font-mono text-xs">
              No vulnerabilities found
            </div>
          ) : (
            findings.map((item) => {
              const isCritical = item.severity === "CRITICAL";
              const isHigh = item.severity === "HIGH";
              const isMedium = item.severity === "MEDIUM";

              const severityBadgeColor = isCritical
                ? "text-[#D4762A] border-[#D4762A]/20 bg-[#D4762A]/5"
                : isHigh
                  ? "text-[#C4701F] border-[#C4701F]/20 bg-[#C4701F]/5"
                  : isMedium
                    ? "text-[#A89F94] border-[#A89F94]/20 bg-[#A89F94]/5"
                    : "text-[#4A4440] border-[#4A4440]/20 bg-[#4A4440]/5";

              return (
                <Link
                  key={item.id}
                  href={`/vulnerabilities/${item.id}`}
                  className="bg-[#141210] border-y border-[#2E2A26] hover:bg-[#1A1714] transition-colors group cursor-pointer block"
                >
                  <div className="flex items-center py-6 px-8">
                    <div className="w-[15%]">
                      <span
                        className={`badge-ui ${severityBadgeColor} inline-block min-w-[70px] text-center`}
                      >
                        {item.severity}
                      </span>
                    </div>

                    <div className="w-[45%]">
                      <h4 className="text-base font-bold text-[#F5F2EE] tracking-tight m-0 mb-1.5 group-hover:text-[#C4701F] transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440]">
                        <Folder size={12} />
                        {item.path}
                      </div>
                    </div>

                    <div className="w-[20%] text-right text-[11px] font-mono text-[#A89F94]">
                      {item.detected}
                    </div>

                    <div className="w-[20%] flex items-center justify-end gap-6">
                      <span className="text-[10px] font-mono text-[#4A4440] uppercase tracking-widest bg-[#0E0D0C] px-3 py-1 rounded-sm border border-[#2E2A26]">
                        {item.status}
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-[#4A4440] group-hover:text-[#C4701F] transform group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-12 flex justify-end">
          <button className="flex items-center gap-3 text-[10px] font-mono text-[#4A4440] hover:text-[#C4701F] uppercase tracking-[0.2em] transition-colors">
            Load Next 50 Findings
            <ArrowDown size={14} />
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
