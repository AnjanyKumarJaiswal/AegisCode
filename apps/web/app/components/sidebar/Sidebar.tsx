"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Shield,
  FileText,
  Settings,
  Terminal,
  HelpCircle,
  Activity,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName =
    user?.username?.trim() || user?.email?.split("@")[0] || "Operator";

  const handleLogout = async () => {
    await logout();
    router.push("/sign-in");
  };

  const mainNav = [
    { label: "COMMAND CENTER", href: "/dashboard", icon: LayoutGrid },
    { label: "THREAT HUNTER", href: "/threats", icon: Shield },
    { label: "VULNERABILITY FEED", href: "/vulnerabilities", icon: Activity },
    { label: "AUDIT LOGS", href: "/logs", icon: FileText },
    { label: "SETTINGS", href: "/settings", icon: Settings },
  ];

  const bottomNav = [
    { label: "DOCUMENTATION", href: "/docs", icon: HelpCircle },
    { label: "SYSTEM STATUS", href: "/status", icon: Activity },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo !flex !flex-row !items-center !justify-between !px-4">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex flex-col whitespace-nowrap sidebar-text">
            <span className="logo-text">AEGISCODE</span>
          </div>
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`text-[#4A4440] hover:text-[#C4701F] transition-colors p-1 shrink-0 ${isCollapsed ? "mx-auto" : ""}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <div className="sidebar-nav">
        {mainNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""} ${isCollapsed ? "justify-center !px-0" : ""}`}
              title={isCollapsed ? item.label : ""}
            >
              <Icon size={14} className="shrink-0" />
              <span className="sidebar-text">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div
        className={`mt-auto border-t border-[#2E2A26] ${isCollapsed ? "p-3" : "p-6"}`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <button
              className="w-10 h-10 flex items-center justify-center bg-[#C4701F] hover:bg-[#D47C2F] text-[#0E0D0C] rounded-sm transition-colors"
              title="Deploy Scanner"
            >
              <Rocket size={16} />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center bg-[#1A1714] hover:bg-[#2E2A26] text-[#A89F94] border border-[#2E2A26] rounded-sm transition-colors"
              title="Execute Command"
            >
              <Terminal size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              className="btn-deploy flex items-center gap-3 px-4"
              title="Deploy Scanner"
            >
              <Rocket size={14} className="shrink-0" />
              <span className="font-bold tracking-widest text-[10px]">
                DEPLOY SCANNER
              </span>
            </button>
            <button
              className="btn-primary w-full h-[42px] text-[10px] flex items-center gap-3 px-4"
              title="Execute Command"
            >
              <Terminal size={14} className="shrink-0" />
              <span className="font-bold tracking-widest text-[10px]">
                EXECUTE COMMAND
              </span>
            </button>
          </div>
        )}

        <div
          className={`mt-8 flex items-center gap-3 ${isCollapsed ? "justify-center px-0" : "px-2"}`}
        >
          <Link
            href="/settings/user-profile"
            className="flex items-center gap-3 hover:bg-[#1A1714] p-2 rounded-sm transition-colors group flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-sm bg-[#1A1714] border border-[#2E2A26] flex items-center justify-center shrink-0 group-hover:border-[#C4701F] transition-colors">
              <User
                size={16}
                className="text-[#4A4440] group-hover:text-[#C4701F] transition-colors"
              />
            </div>
            <div className="flex flex-col overflow-hidden sidebar-text">
              <span className="text-[10px] font-bold text-[#F5F2EE] truncate group-hover:text-[#C4701F] transition-colors">
                {displayName}
              </span>
            </div>
          </Link>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-[#4A4440] hover:text-[#E05A5A] transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="mt-3 w-full flex justify-center p-2 text-[#4A4440] hover:text-[#E05A5A] transition-colors"
          >
            <LogOut size={14} />
          </button>
        )}

        <div className="mt-6 flex flex-col gap-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-1 text-[9px] font-mono text-[#4A4440] hover:text-[#A89F94] transition-colors uppercase tracking-widest ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : ""}
              >
                <Icon size={12} className="shrink-0" />
                <span className="sidebar-text">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
