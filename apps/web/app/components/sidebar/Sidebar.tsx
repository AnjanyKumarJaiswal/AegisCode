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
  isReady: boolean;
  onToggleCollapse: () => void;
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  isCollapsed,
  isReady,
  onToggleCollapse,
}: SidebarProps) {
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
    <aside
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isReady ? "sidebar-ready" : ""}`}
    >
      <div className="sidebar-logo">
        {!isCollapsed && (
          <Link href="/dashboard" className="sidebar-brand">
            <span className="logo-text">AEGISCODE</span>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="sidebar-toggle"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {mainNav.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={16} className="nav-icon" />
              <span className="sidebar-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className={`sidebar-actions ${isCollapsed ? "collapsed" : ""}`}>
          <button
            type="button"
            className="btn-deploy"
            title="Deploy Scanner"
          >
            <Rocket size={14} className="action-icon" />
            <span className="sidebar-text">Deploy Scanner</span>
          </button>
          <button
            type="button"
            className="btn-secondary-action"
            title="Execute Command"
          >
            <Terminal size={14} className="action-icon" />
            <span className="sidebar-text">Execute Command</span>
          </button>
        </div>

        {isCollapsed ? (
          <div className="sidebar-collapsed-meta">
            <Link
              href="/settings/user-profile"
              className="sidebar-icon-tile sidebar-user-tile"
              title={displayName}
            >
              <User size={16} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-icon-tile sidebar-logout-tile"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="sidebar-user-row">
            <Link
              href="/settings/user-profile"
              className="sidebar-user-link"
            >
              <div className="sidebar-user-avatar">
                <User size={16} />
              </div>
              <span className="sidebar-text sidebar-user-name">{displayName}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="sidebar-logout"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        <div className={`sidebar-bottom-nav ${isCollapsed ? "collapsed" : ""}`}>
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="sidebar-bottom-link"
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={12} className="bottom-nav-icon" />
                <span className="sidebar-text">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
