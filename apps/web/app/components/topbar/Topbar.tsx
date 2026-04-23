"use client";

import { Search, Bell } from "lucide-react";

export default function Topbar() {
    return (
        <header className="topbar">
            {/* Search */}
            <div className="search-container">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4440]" />
                <input 
                    type="text" 
                    placeholder="Search systems..." 
                    className="search-input"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6 ml-auto">
                <button className="text-[#A89F94] hover:text-[#F5F2EE] transition-colors">
                    <Bell size={18} />
                </button>
            </div>
        </header>
    );
}
