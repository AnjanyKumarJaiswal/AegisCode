"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import { 
    Wrench, Ticket, AlertTriangle, Code, 
    Server, Globe, Clock, Users, ChevronLeft 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VulnerabilityDetailPage() {
    const params = useParams();
    const vulnId = params.id as string;

    return (
        <DashboardShell>
            <div className="content-inner !max-w-[1100px]">
                {/* Back Button */}
                <Link 
                    href="/vulnerabilities" 
                    className="flex items-center gap-2 text-[10px] font-mono text-[#4A4440] hover:text-[#C4701F] uppercase tracking-widest mb-8 transition-colors group"
                >
                    <ChevronLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" />
                    Back to Findings
                </Link>

                {/* Header Section */}
                <div className="flex justify-between items-start mb-12">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase border border-[#D4762A]/40 text-[#D4762A] px-2 py-0.5 rounded-sm bg-[#D4762A]/5">
                                • Critical Severity
                            </span>
                            <span className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest">
                                ID: VULN-2023-8941
                            </span>
                        </div>
                        <h1 className="text-5xl font-serif leading-[1.1] text-[#F5F2EE] mb-6">
                            SQL Injection in User Authentication Flow
                        </h1>
                        <p className="text-[#A89F94] text-lg leading-relaxed font-light">
                            Improper sanitization of user-supplied input in the login endpoint allows attackers 
                            to bypass authentication and execute arbitrary SQL commands against the primary database.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button className="bg-[#C4701F] hover:bg-[#D47C2F] text-[#0E0D0C] font-mono font-bold py-4 px-8 rounded-sm flex items-center gap-3 transition-all transform hover:-translate-y-1">
                            <Wrench size={18} />
                            <span className="text-xs tracking-widest uppercase">Recommended Fix</span>
                        </button>
                        <button className="text-[10px] font-mono text-[#4A4440] hover:text-[#F5F2EE] uppercase tracking-widest text-center py-2 transition-colors">
                            Assign Ticket
                        </button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-[1fr,320px] gap-8">
                    
                    {/* Left Column */}
                    <div className="flex flex-col gap-8">
                        
                        {/* Business Impact */}
                        <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle size={18} className="text-[#A89F94]" />
                                <h3 className="text-xs font-mono font-bold text-[#F5F2EE] uppercase tracking-widest">Business Impact</h3>
                            </div>
                            <div className="text-[#A89F94] text-[14px] leading-relaxed space-y-4 font-light">
                                <p>
                                    Successful exploitation leads to complete database compromise, potentially exposing PII for over 2.4 million active users. 
                                    The attacker can extract, modify, or delete records within the `users` and `payment_profiles` tables.
                                </p>
                                <p>
                                    This vulnerability bypasses all application-level logging mechanisms, rendering post-incident forensics difficult.
                                </p>
                            </div>
                        </div>

                        {/* Affected Code */}
                        <div className="bg-[#141210] border border-[#2E2A26] rounded-sm overflow-hidden">
                            <div className="flex items-center justify-between p-4 px-6 border-b border-[#2E2A26]">
                                <div className="flex items-center gap-3">
                                    <Code size={16} className="text-[#4A4440]" />
                                    <h3 className="text-[10px] font-mono font-bold text-[#F5F2EE] uppercase tracking-widest">Affected Source Code</h3>
                                </div>
                                <span className="text-[10px] font-mono text-[#4A4440]">src/auth/login.controller.ts</span>
                            </div>
                            <div className="p-0 font-mono text-[13px] bg-[#0E0D0C]">
                                <div className="flex">
                                    <div className="w-12 py-4 bg-[#141210] text-[#4A4440] text-right pr-4 select-none border-r border-[#2E2A26]">
                                        42<br/>43<br/>44<br/>45<br/>46<br/>47<br/>48<br/>49<br/>50<br/>51<br/>52
                                    </div>
                                    <div className="py-4 px-6 text-[#A89F94] w-full">
                                        async authenticateUser(req: Request, res: Response) &#123; <br/>
                                        &nbsp;&nbsp;const username = req.body.username;<br/>
                                        &nbsp;&nbsp;const password = req.body.password;<br/>
                                        <br/>
                                        &nbsp;&nbsp;<span className="text-[#4A4440] italic">// INSECURE: Direct string concatenation</span><br/>
                                        <div className="bg-[#D4762A]/10 text-[#D4762A] -mx-6 px-6 py-1 border-y border-[#D4762A]/20">
                                            &nbsp;&nbsp;const query = `SELECT * FROM users WHERE username = '$&#123;username&#125;' AND password = '$&#123;password&#125;'`;
                                        </div>
                                        <br/>
                                        &nbsp;&nbsp;try &#123;<br/>
                                        &nbsp;&nbsp;&nbsp;&nbsp;const result = await db.execute(query);<br/>
                                        &nbsp;&nbsp;&nbsp;&nbsp;if (result.rows.length &gt; 0) &#123;<br/>
                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return res.status(200).json(&#123; token: generateToken(...) &#125;);
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="flex flex-col gap-8">
                        
                        {/* Score Card */}
                        <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
                            <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-[0.2em] mb-4">CVSS Base Score</p>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-5xl font-bold text-[#F5F2EE]">9.8</span>
                                <span className="text-xl font-mono text-[#4A4440]">/10</span>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-[#4A4440] uppercase tracking-widest">Status</span>
                                    <span className="text-[10px] font-mono font-bold text-[#C4701F] uppercase tracking-widest">Open</span>
                                </div>
                                <div className="pt-6 border-t border-[#2E2A26]">
                                    <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-2">Vector</p>
                                    <p className="text-[10px] font-mono text-[#A89F94] leading-relaxed break-all">CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</p>
                                </div>
                                <div className="flex justify-between items-center pt-6 border-t border-[#2E2A26]">
                                    <span className="text-[10px] font-mono text-[#4A4440] uppercase tracking-widest">Exploitability</span>
                                    <span className="text-[10px] font-mono font-bold text-[#D4762A] uppercase tracking-widest">High</span>
                                </div>
                            </div>
                        </div>

                        {/* Asset Context */}
                        <div className="bg-[#141210] border border-[#2E2A26] p-8 rounded-sm">
                            <h3 className="text-xs font-mono font-bold text-[#F5F2EE] uppercase tracking-widest mb-8">Asset Context</h3>
                            
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Target Asset</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#0E0D0C] border border-[#2E2A26] flex items-center justify-center rounded-sm">
                                            <Server size={14} className="text-[#4A4440]" />
                                        </div>
                                        <span className="text-sm font-bold text-[#F5F2EE]">auth-svc-production</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Environment</p>
                                    <span className="text-[10px] font-mono text-[#C4701F] bg-[#C4701F]/5 border border-[#C4701F]/20 px-3 py-1 rounded-sm uppercase tracking-widest">
                                        Production
                                    </span>
                                </div>

                                <div>
                                    <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">First Discovered</p>
                                    <div className="flex items-center gap-2 text-sm text-[#A89F94]">
                                        <Clock size={14} />
                                        <span>2023-10-24 14:32:05 UTC</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-mono text-[#4A4440] uppercase tracking-widest mb-3">Owner</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-[#2E2A26] rounded-full flex items-center justify-center text-[9px] font-bold text-[#F5F2EE]">
                                            EK
                                        </div>
                                        <span className="text-sm text-[#A89F94]">Engineering Core Team</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
