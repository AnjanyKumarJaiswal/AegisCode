"use client";

import { ReactNode, useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import Topbar from "../topbar/Topbar";
import "../../dashboard/dashboard-ui.css";

export default function DashboardShell({ children }: { children: ReactNode }) {
    // Initialize synchronously to prevent "flash" of uncollapsed sidebar
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("sidebar-collapsed") === "true";
        }
        return false;
    });

    const toggleSidebar = (val: boolean) => {
        setIsCollapsed(val);
        localStorage.setItem("sidebar-collapsed", String(val));
    };

    return (
        <div className="dash-shell">
            {/* Sidebar */}
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={toggleSidebar} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Topbar />
                
                {/* Scrollable Content */}
                <main className="main-content custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
