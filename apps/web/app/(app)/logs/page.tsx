"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Calendar, Code, Box, Database } from "lucide-react";

interface ScanLog {
  id: string;
  file: string;
  path: string;
  scanId: string;
  engine: string;
  duration: string;
  status: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLEAN";
  severity: "critical" | "high" | "clean";
}

export default function AuditLogsPage() {
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/v2/logs");
        if (res.ok) {
          const data = await res.json();
          setScanLogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch scan logs:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchLogs();
  }, []);

  return (
    <div className="content-inner">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="dash-subtitle !text-[#C4701F]/80 mb-1">AUDIT LOGS</p>
            <h1 className="dash-title !text-4xl">Scan History</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-[#1A1714] border border-[#2E2A26] px-4 py-2 text-[11px] font-mono text-[#A89F94] hover:text-[#F5F2EE] transition-colors rounded-sm">
              <Filter size={14} />
              Filter
            </button>
            <button className="flex items-center gap-2 bg-[#1A1714] border border-[#2E2A26] px-4 py-2 text-[11px] font-mono text-[#A89F94] hover:text-[#F5F2EE] transition-colors rounded-sm">
              <Calendar size={14} />
              Last 7 Days
            </button>
          </div>
        </div>

        <div className="flex items-center px-8 mb-4 text-[10px] font-mono text-[#4A4440] uppercase tracking-[0.2em] border-b border-[#2E2A26] pb-4">
          <div className="w-[30%]">Target / File</div>
          <div className="w-[15%]">Scan ID</div>
          <div className="w-[20%]">Engine</div>
          <div className="w-[15%]">Duration</div>
          <div className="w-[20%] text-right">Status</div>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-12 text-[#4A4440] font-mono text-xs">
              Loading...
            </div>
          ) : scanLogs.length === 0 ? (
            <div className="text-center py-12 text-[#4A4440] font-mono text-xs">
              No scan logs found
            </div>
          ) : (
            scanLogs.map((log) => {
              const isCritical = log.severity === "critical";
              const isHigh = log.severity === "high";

              const accentColor = isCritical
                ? "#D4762A"
                : isHigh
                  ? "#C4701F"
                  : "#7A9970";
              const badgeColor = isCritical
                ? "text-[#D4762A] border-[#D4762A]/20 bg-[#D4762A]/5"
                : isHigh
                  ? "text-[#C4701F] border-[#C4701F]/20 bg-[#C4701F]/5"
                  : "text-[#7A9970] border-[#7A9970]/20 bg-[#7A9970]/5";

              return (
                <div
                  key={log.id}
                  className="bg-[#141210] border border-[#2E2A26] rounded-sm relative overflow-hidden group hover:border-[#C4701F]/30 transition-all duration-200"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div className="flex items-center py-5 px-8">
                    <div className="w-[30%] flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#0E0D0C] border border-[#2E2A26] flex items-center justify-center rounded-sm text-[#4A4440] group-hover:text-[#F5F2EE] transition-colors">
                        {log.severity === "clean" ? (
                          <Database size={18} />
                        ) : log.severity === "high" ? (
                          <Box size={18} />
                        ) : (
                          <Code size={18} />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-[#F5F2EE] tracking-wide m-0 truncate">
                          {log.file}
                        </h4>
                        <p className="text-[10px] font-mono text-[#4A4440] mt-0.5 truncate">
                          {log.path}
                        </p>
                      </div>
                    </div>

                    <div className="w-[15%] text-[11px] font-mono text-[#A89F94]">
                      {log.scanId}
                    </div>

                    <div className="w-[20%] flex items-center gap-2 text-[11px] font-mono text-[#A89F94]">
                      {log.engine === "GitHub Copilot" ? (
                        <Box size={12} />
                      ) : (
                        <Code size={12} />
                      )}
                      {log.engine}
                    </div>

                    <div className="w-[15%] text-[11px] font-mono text-[#A89F94]">
                      {log.duration}
                    </div>

                    <div className="w-[20%] flex justify-end">
                      <div
                        className={`badge-ui ${badgeColor} flex items-center gap-2 min-w-[90px] justify-center`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {log.status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <button className="text-[10px] font-mono text-[#4A4440] hover:text-[#C4701F] uppercase tracking-[0.2em] underline underline-offset-8 decoration-dotted transition-colors">
            Load Older Scans
          </button>
        </div>
      </div>
  );
}
