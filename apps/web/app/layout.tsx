import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
import { IBM_Plex_Mono } from "next/font/google";
import Navbar from "./components/navbar/Navbar";
import Bootscreen from "./components/bootscreen/Bootscreen";
import "./globals.css";

const geist = Geist({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600"],
    display: "swap",
});

const instrumentSerif = Instrument_Serif({
    variable: "--font-serif",
    subsets: ["latin"],
    weight: ["400"],
    style: ["normal", "italic"],
    display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
    weight: ["300", "400", "500"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "AegisCode — Real-Time Security for AI-Generated Code",
    description:
        "AegisCode scans every AI-generated line in real time, scores it for risk across 12 vulnerability classes, and closes the loop before you commit.",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${geist.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable}`}
        >
            <body>
                <Bootscreen />
                <Navbar />
                {children}
            </body>
        </html>
    );
}
