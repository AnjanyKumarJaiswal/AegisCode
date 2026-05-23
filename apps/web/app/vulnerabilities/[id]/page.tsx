"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import {
  Wrench,
  AlertTriangle,
  Code,
  FileCode,
  Clock,
  ChevronLeft,
  Scan,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type CodeSnippetLine = {
  number: number;
  content: string;
  isHighlighted: boolean;
};

type CodeSnippet = {
  filePath: string;
  languageId: string | null;
  lines: CodeSnippetLine[];
  highlightReason: string | null;
};

interface VulnerabilityDetail {
  id: string;
  title: string;
  category: string;
  severity: string;
  description: string;
  fixSuggestion: string;
  fileLocation: string;
  fileName: string;
  lineNumber: number | null;
  status: string;
  score: number;
  detected: string;
  detectedLabel: string;
  scanId: string;
  sessionId: string;
  triggerType: string;
  triggerLabel: string;
  scanCreatedAt: string;
  scanCreatedLabel: string;
  languageId: string | null;
  exploitability: string;
  codeSnippet: CodeSnippet | null;
}

function severityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "text-[#D4762A] border-[#D4762A]/40 bg-[#D4762A]/5";
    case "HIGH":
      return "text-[#D4762A] border-[#D4762A]/40 bg-[#D4762A]/5";
    case "MEDIUM":
      return "text-[#C4701F] border-[#C4701F]/40 bg-[#C4701F]/5";
    case "LOW":
      return "text-[#A89F94] border-[#A89F94]/40 bg-[#A89F94]/5";
    default:
      return "text-[#4A4440] border-[#4A4440]/40 bg-[#4A4440]/5";
  }
}

function statusColor(status: string): string {
  return status.toUpperCase() === "FIXED"
    ? "text-[#7A9970]"
    : "text-[#C4701F]";
}

export default function VulnerabilityDetailPage() {
  const params = useParams();
  const vulnId = params.id as string;
  const [vulnerability, setVulnerability] =
    useState<VulnerabilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVulnerability() {
      try {
        const res = await fetch(`/api/v2/vulnerabilities/${vulnId}`);
        if (!res.ok) {
          setError(
            res.status === 404
              ? "Vulnerability not found."
              : "Failed to load vulnerability details.",
          );
          return;
        }
        const data = await res.json();
        setVulnerability(data);
      } catch (err) {
        console.error("Failed to fetch vulnerability:", err);
        setError("Failed to load vulnerability details.");
      } finally {
        setLoading(false);
      }
    }

    if (vulnId) void fetchVulnerability();
  }, [vulnId]);

  const scrollToFix = () => {
    document.getElementById("recommended-fix")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <DashboardShell>
      <div className="content-inner !max-w-[1100px]">
        <Link
          href="/vulnerabilities"
          className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440] hover:text-[#C4701F] uppercase tracking-widest mb-8 transition-colors group"
        >
          <ChevronLeft
            size={14}
            className="transform group-hover:-translate-x-1 transition-transform"
          />
          Back to Findings
        </Link>

        {loading ? (
          <p className="text-[#4A4440] font-mono text-sm uppercase tracking-widest">
            Loading vulnerability...
          </p>
        ) : error ? (
          <p className="text-[#D4762A] font-mono text-sm">{error}</p>
        ) : vulnerability ? (
          <>
            <div className="flex justify-between items-start mb-12 gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                  <span
                    className={`text-[9px] font-mono font-bold tracking-[0.2em] uppercase border px-2 py-0.5 rounded-sm ${severityColor(vulnerability.severity)}`}
                  >
                    • {vulnerability.severity} Severity
                  </span>
                  <span className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest">
                    {vulnerability.category}
                  </span>
                  <span className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest">
                    ID: {vulnerability.id}
                  </span>
                </div>
                <h1 className="text-5xl font-serif leading-[1.1] text-[#F5F2EE] mb-6">
                  {vulnerability.title}
                </h1>
                <p className="text-[#A89F94] text-lg leading-relaxed font-light">
                  {vulnerability.description}
                </p>
              </div>

              <div className="flex flex-col gap-4 shrink-0">
                <button
                  type="button"
                  onClick={scrollToFix}
                  className="bg-[#C4701F] hover:bg-[#D47C2F] text-[#0E0D0C] font-mono font-bold py-4 px-8 rounded-sm flex items-center gap-3 transition-all transform hover:-translate-y-1"
                >
                  <Wrench size={18} />
                  <span className="text-xs tracking-widest uppercase">
                    Recommended Fix
                  </span>
                </button>
                <Link
                  href="/logs"
                  className="text-[10px] font-mono text-[#4A4440] hover:text-[#F5F2EE] uppercase tracking-widest text-center py-2 transition-colors"
                >
                  View Scan History
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-[1fr,320px] gap-8">
              <div className="flex flex-col gap-8">
                <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle size={18} className="text-[#A89F94]" />
                    <h3 className="text-xs font-mono font-bold text-[#F5F2EE] uppercase tracking-widest">
                      Why This Is a Risk
                    </h3>
                  </div>
                  <div className="text-[#A89F94] text-[14px] leading-relaxed font-light whitespace-pre-wrap">
                    {vulnerability.description}
                  </div>
                </div>

                <div className="bg-[#141210] border border-[#2E2A26] rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 px-6 border-b border-[#2E2A26] gap-4">
                    <div className="flex items-center gap-3">
                      <Code size={16} className="text-[#4A4440]" />
                      <h3 className="text-[10px] font-mono font-bold text-[#F5F2EE] uppercase tracking-widest">
                        Affected Source Code
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#4A4440] truncate max-w-[280px]">
                      {vulnerability.fileLocation}
                      {vulnerability.lineNumber
                        ? `:${vulnerability.lineNumber}`
                        : ""}
                    </span>
                  </div>

                  {vulnerability.codeSnippet ? (
                    <>
                      {vulnerability.codeSnippet.highlightReason ? (
                        <div className="px-6 py-3 border-b border-[#2E2A26] bg-[#D4762A]/5">
                          <p className="text-[11px] font-mono text-[#D4762A] leading-relaxed">
                            {vulnerability.codeSnippet.highlightReason}
                          </p>
                        </div>
                      ) : null}
                      <div className="p-0 font-mono text-[13px] bg-[#0E0D0C] overflow-x-auto">
                        <div className="flex min-w-max">
                          <div className="w-12 py-4 bg-[#141210] text-[#4A4440] text-right pr-4 select-none border-r border-[#2E2A26] shrink-0">
                            {vulnerability.codeSnippet.lines.map((line) => (
                              <div key={line.number}>{line.number}</div>
                            ))}
                          </div>
                          <div className="py-4 px-6 text-[#A89F94] w-full">
                            {vulnerability.codeSnippet.lines.map((line) => (
                              <div
                                key={line.number}
                                className={
                                  line.isHighlighted
                                    ? "bg-[#D4762A]/10 text-[#D4762A] -mx-6 px-6 border-y border-[#D4762A]/20 whitespace-pre"
                                    : "whitespace-pre"
                                }
                              >
                                {line.content || " "}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-[#4A4440] text-sm font-mono leading-relaxed">
                      Source code was not captured for this scan. Run a new scan
                      from your IDE to store the affected file content.
                      {vulnerability.lineNumber ? (
                        <>
                          {" "}
                          Reported at line {vulnerability.lineNumber} in{" "}
                          {vulnerability.fileName}.
                        </>
                      ) : null}
                    </div>
                  )}
                </div>

                <div
                  id="recommended-fix"
                  className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Wrench size={18} className="text-[#C4701F]" />
                    <h3 className="text-xs font-mono font-bold text-[#F5F2EE] uppercase tracking-widest">
                      Recommended Fix
                    </h3>
                  </div>
                  <div className="text-[#A89F94] text-[14px] leading-relaxed font-light whitespace-pre-wrap">
                    {vulnerability.fixSuggestion}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
                  <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-[0.2em] mb-4">
                    Scan Risk Score
                  </p>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-bold text-[#F5F2EE]">
                      {vulnerability.score.toFixed(1)}
                    </span>
                    <span className="text-xl font-mono text-[#4A4440]">
                      /10
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-[#4A4440] uppercase tracking-widest">
                        Status
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-widest ${statusColor(vulnerability.status)}`}
                      >
                        {vulnerability.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-[#2E2A26]">
                      <span className="text-[10px] font-mono text-[#4A4440] uppercase tracking-widest">
                        Exploitability
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#D4762A] uppercase tracking-widest">
                        {vulnerability.exploitability}
                      </span>
                    </div>
                    <div className="pt-6 border-t border-[#2E2A26]">
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-2">
                        Category
                      </p>
                      <p className="text-[10px] font-mono text-[#A89F94] leading-relaxed">
                        {vulnerability.category}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
                  <h3 className="text-xs font-mono font-bold text-[#F5F2EE] uppercase tracking-widest mb-8">
                    Scan Context
                  </h3>

                  <div className="space-y-8">
                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Affected File
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0E0D0C] border border-[#2E2A26] flex items-center justify-center rounded-sm shrink-0">
                          <FileCode size={14} className="text-[#4A4440]" />
                        </div>
                        <span className="text-sm font-bold text-[#F5F2EE] break-all">
                          {vulnerability.fileName}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-[#4A4440] mt-2 break-all">
                        {vulnerability.fileLocation}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Language
                      </p>
                      <span className="text-[10px] font-mono text-[#C4701F] bg-[#C4701F]/5 border border-[#C4701F]/20 px-3 py-1 rounded-sm uppercase tracking-widest">
                        {vulnerability.languageId ?? "Unknown"}
                      </span>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Line Number
                      </p>
                      <span className="text-sm text-[#A89F94] font-mono">
                        {vulnerability.lineNumber ?? "Not specified"}
                      </span>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Scan Trigger
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#A89F94]">
                        <Scan size={14} />
                        <span>{vulnerability.triggerLabel}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Detected At
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#A89F94]">
                        <Clock size={14} />
                        <span>{vulnerability.detectedLabel}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Scan Completed
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#A89F94]">
                        <Clock size={14} />
                        <span>{vulnerability.scanCreatedLabel}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Scan ID
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440] break-all">
                        <Hash size={12} />
                        <span>{vulnerability.scanId}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                        Session ID
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440] break-all">
                        <Hash size={12} />
                        <span>{vulnerability.sessionId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
