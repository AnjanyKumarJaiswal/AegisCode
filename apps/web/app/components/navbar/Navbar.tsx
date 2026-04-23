"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./navbar.css";

const NAV_LINKS = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Docs", href: "#docs" },
    { label: "Changelog", href: "#changelog" },
] as const;

const MobileDotGrid = () => (
    <>
        <span className="mobile-dot" />
        <span className="mobile-dot" />
        <span className="mobile-dot" />
        <span className="mobile-dot" />
    </>
);

export default function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [overlayOpen, setOverlay] = useState(false);
    const [activeLink, setActiveLink] = useState<string | null>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const onScroll = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => setScrolled(window.scrollY > 40));
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafRef.current); };
    }, []);

    useEffect(() => {
        document.body.style.overflow = overlayOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [overlayOpen]);

    
    const isDashboardRoute = pathname?.startsWith("/dashboard") || 
                             pathname?.startsWith("/threats") || 
                             pathname?.startsWith("/vulnerabilities") || 
                             pathname?.startsWith("/logs") || 
                             pathname?.startsWith("/settings") || 
                             pathname?.startsWith("/sign-in");

    if (isDashboardRoute) return null;

    return (
        <>
            <nav className={`navbar${scrolled ? " scrolled" : ""}`} aria-label="Main navigation">
                <div className="navbar-left">
                    <span className="navbar-wordmark">AegisCode</span>
                    <span className="navbar-sep" aria-hidden="true" />
                    <span className="navbar-descriptor">security guardian</span>
                </div>

                <div className="navbar-center">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className={`nav-link${activeLink === link.label ? " active" : ""}`}
                            onClick={() => setActiveLink(link.label)}
                        >
                            {link.label}
                            <span className="nav-link-dot" aria-hidden="true" />
                        </a>
                    ))}
                </div>

                <div className="navbar-right">
                    <Link href="/sign-in" className="nav-signin">Sign in</Link>
                    <button className="nav-cta" type="button">Get Early Access</button>
                </div>

                <button className="navbar-mobile-toggle" aria-label="Open menu" onClick={() => setOverlay(true)} type="button">
                    <MobileDotGrid />
                </button>
            </nav>

            <div className={`navbar-overlay${overlayOpen ? " open" : ""}`} aria-modal="true" role="dialog" aria-label="Navigation menu">
                <button className="overlay-close" aria-label="Close menu" onClick={() => setOverlay(false)} type="button">
                    <MobileDotGrid />
                </button>
                {NAV_LINKS.map((link) => (
                    <a
                        key={link.label}
                        href={link.href}
                        className="overlay-nav-link"
                        onClick={() => { setActiveLink(link.label); setOverlay(false); }}
                    >
                        {link.label}
                    </a>
                ))}
                <div className="overlay-actions">
                    <Link href="/sign-in" className="nav-signin" onClick={() => setOverlay(false)}>Sign in</Link>
                    <button className="nav-cta" type="button">Get Early Access</button>
                </div>
            </div>
        </>
    );
}

