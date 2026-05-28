"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  Puzzle,
  Bell,
  Copy,
  Info,
  User,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { formatRelativeTime } from "../../utils/ideRedirect";

interface Settings {
  criticalAlerts: boolean;
  weeklySummary: boolean;
  integration?: {
    ideClient: string | null;
    lastSyncAt: string | null;
    connected: boolean;
  };
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface CreatedApiKey extends ApiKeyItem {
  key: string;
}

function formatKeyDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    criticalAlerts: true,
    weeklySummary: false,
  });
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, keysRes] = await Promise.all([
          fetch("/api/v2/settings"),
          fetch("/api/v2/settings/api-keys"),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data);
        }

        if (keysRes.ok) {
          const data = await keysRes.json();
          setApiKeys(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/v2/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criticalAlerts: settings.criticalAlerts,
          weeklySummary: settings.weeklySummary,
        }),
      });
      if (res.ok) {
        setSaveMessage("Preferences saved.");
        setTimeout(() => setSaveMessage(null), 2500);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/v2/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || undefined }),
      });

      if (res.ok) {
        const data = (await res.json()) as CreatedApiKey;
        setCreatedKey(data);
        setApiKeys((prev) => [
          {
            id: data.id,
            name: data.name,
            keyPrefix: data.keyPrefix,
            createdAt: data.createdAt,
            lastUsedAt: data.lastUsedAt,
          },
          ...prev,
        ]);
        setShowCreateForm(false);
        setNewKeyName("");
      }
    } catch (err) {
      console.error("Failed to create API key:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await fetch(`/api/v2/settings/api-keys/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((key) => key.id !== id));
      }
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    }
  };

  const handleCopyCreatedKey = async () => {
    if (!createdKey?.key) return;
    await navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integration = settings.integration;
  const ideLabel = integration?.ideClient
    ? `${integration.ideClient} Integration`
    : "IDE Integration";
  const isConnected = integration?.connected ?? false;
  const lastSyncLabel = formatRelativeTime(integration?.lastSyncAt);

  return (
    <div className="content-inner !max-w-[1000px]">
      <div className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-serif text-[#F5F2EE] mb-4">
            Configuration Protocol
          </h1>
          <p className="text-[#A89F94] text-lg leading-relaxed font-light max-w-2xl">
            Manage API keys, system integrations, and notification preferences
            for your workspace.
          </p>
        </div>
        <Link
          href="/settings/user-profile"
          className="flex items-center gap-3 px-6 py-3 border border-[#2E2A26] rounded-sm text-[10px] font-mono font-bold text-[#F5F2EE] uppercase tracking-widest hover:bg-[#1A1714] hover:border-[#C4701F] transition-all group shrink-0"
        >
          <User
            size={14}
            className="text-[#4A4440] group-hover:text-[#C4701F] transition-colors"
          />
          User Profile
        </Link>
      </div>

      <div className="grid grid-cols-[1fr,300px] gap-8">
        <div className="flex flex-col gap-8">
          <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Key size={18} className="text-[#C4701F]" />
                <h3 className="text-sm font-bold text-[#F5F2EE] uppercase tracking-widest">
                  API Keys
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#2E2A26] rounded-sm text-[10px] font-mono text-[#A89F94] hover:text-[#F5F2EE] hover:border-[#C4701F] transition-colors uppercase tracking-widest"
              >
                <Plus size={14} />
                New Key
              </button>
            </div>
            <p className="text-[11px] font-mono text-[#4A4440] mb-8">
              Create keys to sign in from the IDE or CLI instead of GitHub.
            </p>

            {showCreateForm && (
              <div className="mb-6 p-4 bg-[#0E0D0C] border border-[#2E2A26] rounded-sm">
                <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">
                  Key Label
                </p>
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Cursor Workstation"
                  className="w-full bg-[#141210] border border-[#2E2A26] p-3 text-[12px] font-mono text-[#F5F2EE] placeholder-[#4A4440] rounded-sm outline-none focus:border-[#C4701F] transition-colors mb-4"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewKeyName("");
                    }}
                    className="px-4 py-2 text-[10px] font-mono text-[#4A4440] hover:text-[#F5F2EE] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateKey}
                    disabled={creating}
                    className="px-4 py-2 bg-[#C4701F] text-[#0E0D0C] text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm hover:bg-[#D4762A] transition-colors disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Key"}
                  </button>
                </div>
              </div>
            )}

            {createdKey && (
              <div className="mb-6 p-4 bg-[#D4762A]/5 border border-[#D4762A]/25 rounded-sm">
                <p className="text-[10px] font-mono text-[#D4762A] uppercase tracking-widest mb-2">
                  Copy this key now — it won&apos;t be shown again
                </p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-[11px] font-mono text-[#F5F2EE] break-all bg-[#0E0D0C] border border-[#2E2A26] p-3 rounded-sm">
                    {createdKey.key}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCreatedKey}
                    className="flex items-center gap-2 px-3 py-2 border border-[#2E2A26] rounded-sm text-[10px] font-mono text-[#A89F94] hover:text-[#F5F2EE] hover:border-[#C4701F] transition-colors uppercase tracking-widest shrink-0"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedKey(null)}
                  className="mt-3 text-[9px] font-mono text-[#4A4440] hover:text-[#A89F94] uppercase tracking-widest"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {loading ? (
                <p className="text-center py-8 text-[#4A4440] font-mono text-xs">
                  Loading keys...
                </p>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#2E2A26] rounded-sm">
                  <p className="text-[#4A4440] font-mono text-xs mb-1">
                    No API keys yet
                  </p>
                  <p className="text-[#4A4440] font-mono text-[10px]">
                    Click &quot;New Key&quot; to create one
                  </p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between gap-4 p-4 bg-[#0E0D0C] border border-[#2E2A26] rounded-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#F5F2EE] mb-1">
                        {key.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#4A4440]">
                        {key.keyPrefix}
                      </p>
                      <p className="text-[9px] font-mono text-[#4A4440] mt-1 uppercase tracking-widest">
                        Created {formatKeyDate(key.createdAt)}
                        {key.lastUsedAt
                          ? ` · Last used ${formatRelativeTime(key.lastUsedAt)}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeKey(key.id)}
                      title="Revoke key"
                      className="p-2 text-[#4A4440] hover:text-[#D4762A] transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
            <div className="flex items-center gap-3 mb-10">
              <Puzzle size={18} className="text-[#A89F94]" />
              <h3 className="text-sm font-bold text-[#F5F2EE] uppercase tracking-widest">
                System Integration
              </h3>
            </div>

            <div className="bg-[#0E0D0C] border border-[#2E2A26] p-6 rounded-sm flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-[#141210] border border-[#2E2A26] flex items-center justify-center rounded-sm">
                  <div className="w-6 h-6 border-2 border-[#4A4440] rounded-sm opacity-50" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F2EE] mb-1">
                    {ideLabel}
                  </h4>
                  <p className="text-[11px] font-mono text-[#4A4440]">
                    Real-time vulnerability scanning in your IDE.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest mb-1 ${isConnected ? "text-[#7A9970]" : "text-[#4A4440]"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#7A9970]" : "bg-[#4A4440]"}`}
                  />
                  {isConnected ? "Connected" : "Not Connected"}
                </div>
                <p className="text-[8px] font-mono text-[#4A4440] uppercase tracking-widest">
                  Last Sync: {lastSyncLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm h-full">
            <div className="flex items-start gap-3 mb-10">
              <Bell size={18} className="text-[#A89F94] mt-1" />
              <h3 className="text-sm font-bold text-[#F5F2EE] uppercase tracking-widest leading-tight">
                Alert Preferences
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0E0D0C] p-6 rounded-sm border border-[#2E2A26]">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-[11px] font-bold text-[#F5F2EE]">
                    Critical Vulnerabilities
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        criticalAlerts: !s.criticalAlerts,
                      }))
                    }
                    className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${settings.criticalAlerts ? "bg-[#C4701F]" : "bg-[#2E2A26]"}`}
                  >
                    <div
                      className={`absolute top-1 w-2 h-2 bg-[#0E0D0C] rounded-full transition-all ${settings.criticalAlerts ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>
                <p className="text-[10px] font-mono text-[#4A4440] leading-relaxed">
                  Immediate alerts for critical-severity findings.
                </p>
              </div>

              <div className="bg-[#0E0D0C] p-6 rounded-sm border border-[#2E2A26]">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-[11px] font-bold text-[#F5F2EE]">
                    Weekly Summary
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        weeklySummary: !s.weeklySummary,
                      }))
                    }
                    className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${settings.weeklySummary ? "bg-[#C4701F]" : "bg-[#2E2A26]"}`}
                  >
                    <div
                      className={`absolute top-1 w-2 h-2 bg-[#0E0D0C] rounded-full transition-all ${settings.weeklySummary ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>
                <p className="text-[10px] font-mono text-[#4A4440] leading-relaxed">
                  Aggregated threat intelligence report delivered every Monday.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="mt-6 w-full border border-[#2E2A26] px-4 py-3 text-[10px] font-mono font-bold text-[#F5F2EE] uppercase tracking-widest hover:bg-[#1A1714] hover:border-[#C4701F] transition-colors rounded-sm"
            >
              Save Preferences
            </button>

            {saveMessage && (
              <p className="mt-3 text-[10px] font-mono text-[#7A9970] text-center">
                {saveMessage}
              </p>
            )}

            <div className="mt-8 flex gap-3 p-4 bg-[#C4701F]/5 border border-[#C4701F]/10 rounded-sm">
              <Info size={14} className="text-[#C4701F] flex-shrink-0" />
              <p className="text-[9px] font-mono text-[#A89F94] leading-relaxed italic">
                Use an API key in the IDE extension to authenticate without
                GitHub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
