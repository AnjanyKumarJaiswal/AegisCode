"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import Topbar from "../topbar/Topbar";
import "./dashboard-ui.css";

const STORAGE_KEY = "sidebar-collapsed";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "true";
    setIsCollapsed(stored);
    requestAnimationFrame(() => setIsReady(true));
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="dash-shell">
      <Sidebar
        isCollapsed={isCollapsed}
        isReady={isReady}
        onToggleCollapse={toggleSidebar}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Topbar />

        <main className="main-content custom-scrollbar">{children}</main>
      </div>
    </div>
  );
}
