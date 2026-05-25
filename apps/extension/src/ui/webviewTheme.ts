export const WEBVIEW_FONT_CSP =
  "font-src https://fonts.gstatic.com https://fonts.googleapis.com; style-src 'unsafe-inline' https://fonts.googleapis.com;";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100;200;300;400;500;600&family=IBM+Plex+Mono:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');`;

const TOKENS = `
:root {
    --bg: #0E0D0C;
    --bg-card: #141210;
    --surface: #1A1714;
    --panel: #141210;
    --panel-2: #1A1714;
    --border: #2E2A26;
    --border-subtle: rgba(46, 42, 38, 0.6);
    --white: #F5F2EE;
    --copy: #F5F2EE;
    --grey: #A89F94;
    --copy-dim: #A89F94;
    --grey-dim: #4A4440;
    --copy-faint: #4A4440;
    --amber: #C4701F;
    --amber-hover: #D4762A;
    --vuln: #D4762A;
    --sage: #7A9970;
    --red: #D4762A;
    --yellow: #C4701F;
    --font-sans: "Geist", system-ui, -apple-system, sans-serif;
    --font-serif: "Instrument Serif", Georgia, serif;
    --font-mono: "IBM Plex Mono", "Menlo", "Consolas", monospace;
}
`;

const BASE = `
${FONT_IMPORT}
${TOKENS}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    background: var(--bg);
    color: var(--copy);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
}

body::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, #2A2724 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.45;
    pointer-events: none;
    z-index: 0;
}

body::after {
    content: "";
    position: fixed;
    inset: 0;
    background: radial-gradient(circle 280px at 50% 0%, rgba(196, 112, 31, 0.05) 0%, transparent 100%);
    pointer-events: none;
    z-index: 0;
}

button {
    font-family: inherit;
    color: inherit;
    cursor: pointer;
    border: none;
    background: none;
    outline: none;
}

.shell {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.font-serif {
    font-family: var(--font-serif);
}

.font-mono {
    font-family: var(--font-mono);
}

.section-head {
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.section-title {
    font-family: var(--font-mono);
    color: var(--copy);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
}

.primary-btn {
    width: 100%;
    background: var(--amber);
    color: var(--bg);
    padding: 12px;
    font-size: 10px;
    font-weight: 600;
    font-family: var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s ease, transform 0.15s ease;
    border: none;
    border-radius: 2px;
}

.primary-btn:hover {
    background: var(--amber-hover);
}

.primary-btn:active {
    transform: translateY(1px);
}

.secondary-btn {
    width: 100%;
    background: transparent;
    color: var(--copy);
    border: 1px solid var(--border);
    padding: 10px;
    font-size: 10px;
    font-weight: 600;
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.15s ease;
    border-radius: 2px;
}

.secondary-btn:hover {
    background: var(--surface);
    border-color: var(--amber);
    color: var(--white);
}

.secondary-btn.compact {
    padding: 9px 8px;
    font-size: 9px;
}

.text-btn {
    width: 100%;
    padding: 8px 12px;
    color: var(--grey-dim);
    font-size: 11px;
    font-family: var(--font-mono);
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: color 0.15s ease;
}

.text-btn:hover {
    color: var(--copy);
}

.card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 14px;
}

.empty-copy {
    color: var(--grey-dim);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-align: center;
    padding: 16px 0;
}

.icon-btn {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 2px;
    color: var(--grey-dim);
    transition: all 0.15s ease;
}

.icon-btn:hover {
    background: var(--surface);
    color: var(--copy);
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--grey-dim); }
`;

const SIDEBAR = `
.topbar {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid var(--border);
    background: rgba(14, 13, 12, 0.92);
}

.brand-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.brand-wordmark {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 16px;
    color: var(--white);
    line-height: 1;
    white-space: nowrap;
}

.brand-sub {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--grey-dim);
    margin-top: 2px;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid var(--border);
    white-space: nowrap;
}

.status-badge.active {
    background: rgba(122, 153, 112, 0.08);
    color: var(--sage);
    border-color: rgba(122, 153, 112, 0.25);
}

.status-badge.watching {
    background: rgba(196, 112, 31, 0.08);
    color: var(--amber-hover);
    border-color: rgba(196, 112, 31, 0.25);
}

.top-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
}

.content {
    flex: 1;
    padding: 14px 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.center-panel {
    margin: auto 0;
    padding: 24px 12px 20px;
    text-align: center;
}

.center-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 18px;
    border-radius: 2px;
    display: grid;
    place-items: center;
    border: 1px solid var(--border);
}

.center-icon.shield {
    background: var(--bg-card);
    color: var(--amber);
}

.center-icon.offline {
    background: rgba(212, 118, 42, 0.06);
    color: var(--vuln);
    border-color: rgba(212, 118, 42, 0.2);
}

.wordmark-block {
    margin-bottom: 20px;
}

.wordmark {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 22px;
    color: var(--white);
    margin-bottom: 4px;
}

.descriptor {
    font-family: var(--font-sans);
    font-weight: 200;
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--grey-dim);
}

.hero-title {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 22px;
    font-weight: 400;
    color: var(--white);
    margin-bottom: 10px;
    line-height: 1.15;
}

.hero-copy {
    color: var(--grey);
    font-size: 13px;
    font-weight: 300;
    line-height: 1.65;
    margin-bottom: 20px;
}

.error-box {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 2px solid var(--vuln);
    border-radius: 2px;
    padding: 12px;
    text-align: left;
    margin-bottom: 18px;
}

.error-code {
    color: var(--vuln);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.error-detail {
    color: var(--grey);
    font-size: 11px;
    line-height: 1.55;
}

.btn-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.footer-status {
    text-align: center;
    color: var(--grey-dim);
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 8px 0;
}

.primary-btn.watch-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--copy);
}

.primary-btn.watch-btn:hover {
    border-color: var(--amber);
    color: var(--white);
    background: var(--surface);
}

.meta-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--grey-dim);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.meta-strip.sub {
    margin-top: -8px;
    font-size: 8px;
    opacity: 0.85;
}

.status-badge-inline {
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 2px;
    border: 1px solid var(--border);
    color: var(--grey-dim);
}

.status-badge-inline.active {
    background: rgba(122, 153, 112, 0.08);
    color: var(--sage);
    border-color: rgba(122, 153, 112, 0.25);
}

.summary-card {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 10px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 14px;
}

.summary-left {
    display: flex;
    flex-direction: column;
}

.score-row {
    display: flex;
    align-items: flex-end;
    gap: 2px;
}

.score-value {
    font-family: var(--font-mono);
    font-size: 38px;
    line-height: 1;
    font-weight: 600;
    color: var(--white);
    letter-spacing: -0.04em;
}

.score-max {
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 5px;
}

.risk-pill {
    min-width: 88px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
}

.risk-label-text {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.risk-critical, .risk-high { color: var(--vuln); }
.risk-medium { color: var(--amber); }
.risk-low { color: var(--sage); }

.threat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.threat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 10px;
    min-height: 76px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.threat-label {
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 10px;
}

.threat-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
}

.threat-value {
    font-family: var(--font-mono);
    font-size: 22px;
    line-height: 1;
    font-weight: 600;
}

.recent-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.recent-row {
    width: 100%;
    display: grid;
    grid-template-columns: 22px 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 9px 4px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
    text-align: left;
    transition: background 0.12s ease;
}

.recent-row:hover {
    background: rgba(26, 23, 20, 0.65);
}

.file-icon {
    display: flex;
    align-items: center;
    color: var(--grey-dim);
}

.file-icon.js { color: #F0DB4F; }
.file-icon.py { color: #3572A5; }
.file-icon.css { color: #563D7C; }
.file-icon.json { color: var(--amber); }
.file-icon.folder { color: var(--amber); }

.recent-file {
    font-family: var(--font-sans);
    color: var(--copy);
    font-size: 12px;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.issue-section {
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 12px;
    background: var(--bg-card);
}

.issue-row {
    display: flex;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--border-subtle);
}

.issue-row:last-child { border-bottom: none; }

.issue-row.total {
    border-top: 1px solid var(--border);
    margin-top: 4px;
    padding-top: 9px;
}

.issue-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 10px;
    flex-shrink: 0;
}

.issue-label {
    flex: 1;
    font-size: 12px;
    color: var(--grey);
}

.issue-value {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
}

.footer-panel {
    margin-top: auto;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.split-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.footer-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding-top: 2px;
}

.online { color: var(--sage); }
.idle { color: var(--grey-dim); }

.watching-head { padding-top: 2px; }

.live-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--amber);
    box-shadow: 0 0 8px rgba(196, 112, 31, 0.45);
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.45; transform: scale(0.88); }
}

.section-head.muted {
    color: var(--grey-dim);
    margin-bottom: 0;
    font-size: 8px;
}

.live-line {
    font-family: var(--font-mono);
    color: var(--amber-hover);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
}

.watching-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.watch-file {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.watch-file-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 4px 0;
    border-bottom: 1px solid var(--border);
}

.watch-count {
    color: var(--grey);
    font-size: 9px;
}

.watch-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-left: 2px solid var(--amber);
    border-radius: 2px;
    padding: 10px 12px;
}

.watch-critical { border-left-color: var(--vuln); }
.watch-high { border-left-color: var(--vuln); }
.watch-medium { border-left-color: var(--amber); }
.watch-low, .watch-info { border-left-color: var(--sage); }

.watch-head {
    display: grid;
    grid-template-columns: 18px 1fr auto;
    gap: 8px;
    align-items: center;
    margin-bottom: 6px;
}

.watch-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    color: var(--white);
}

.watch-badge {
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: 2px;
}

.sev-critical, .sev-high { color: var(--vuln); border-color: rgba(212, 118, 42, 0.25); }
.sev-medium { color: var(--amber); border-color: rgba(196, 112, 31, 0.25); }
.sev-low { color: var(--sage); border-color: rgba(122, 153, 112, 0.25); }

.watch-copy {
    color: var(--grey);
    font-size: 11px;
    line-height: 1.55;
    margin-bottom: 8px;
}

.watch-meta {
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 9px;
    letter-spacing: 0.04em;
}

.watch-sep {
    margin: 0 6px;
    opacity: 0.5;
}

.user-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 8px 10px;
    margin-top: -4px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 2px;
    background: rgba(196, 112, 31, 0.12);
    border: 1px solid rgba(196, 112, 31, 0.25);
    color: var(--amber-hover);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    display: grid;
    place-items: center;
    flex-shrink: 0;
}

.user-name {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    color: var(--copy);
    letter-spacing: 0.04em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ide-badge {
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--grey-dim);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 3px 7px;
    border-radius: 2px;
    white-space: nowrap;
}

.user-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.logout-btn {
    display: grid;
    place-items: center;
    padding: 4px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--grey-dim);
    cursor: pointer;
    transition: all 0.15s ease;
}

.logout-btn:hover {
    background: rgba(212, 118, 42, 0.08);
    border-color: var(--vuln);
    color: var(--vuln);
}

.dropdown-wrap { position: relative; }

.dropdown-menu {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 168px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 4px 0;
    z-index: 100;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}

.dropdown-menu.open { display: block; }

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 12px;
    background: none;
    border: none;
    color: var(--copy);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
}

.dropdown-item:hover { background: var(--surface); }
.dropdown-item.danger { color: var(--vuln); }
.dropdown-item.danger:hover { background: rgba(212, 118, 42, 0.08); }
.dropdown-sep {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
}
`;

const FINDINGS = `
.findings-shell {
    min-height: 100vh;
    padding: 14px 12px 20px;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-title {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 18px;
    color: var(--white);
    line-height: 1;
}

.count-badge {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 2px 7px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: var(--grey-dim);
}

.header-actions {
    display: flex;
    gap: 4px;
}

.focus-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--vuln);
    border-radius: 2px;
    padding: 16px 14px;
    margin-bottom: 12px;
}

.severity-critical, .severity-high { border-left-color: var(--vuln); }
.severity-medium { border-left-color: var(--amber); }
.severity-low, .severity-info { border-left-color: var(--sage); }

.focus-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.focus-label {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
}

.focus-confidence {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--grey-dim);
    padding: 3px 8px;
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    border-radius: 2px;
}

.focus-title {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 400;
    line-height: 1.15;
    color: var(--white);
    margin-bottom: 10px;
}

.focus-meta {
    color: var(--grey-dim);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.04em;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.dot {
    color: var(--grey-dim);
    margin: 0 4px;
}

.focus-description {
    color: var(--grey);
    font-size: 12px;
    font-weight: 300;
    line-height: 1.65;
    margin-bottom: 16px;
}

.code-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 2px;
    margin-bottom: 14px;
    overflow: hidden;
}

.code-meta {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.code-block {
    margin: 0;
    padding: 12px;
    white-space: pre-wrap;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.65;
    color: var(--grey);
}

.primary-action {
    width: 100%;
    background: var(--amber);
    color: var(--bg);
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
    border-radius: 2px;
    transition: background 0.15s ease;
}

.primary-action:hover { background: var(--amber-hover); }

.action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 14px;
}

.action-btn {
    width: 100%;
    background: var(--bg-card);
    color: var(--copy);
    border: 1px solid var(--border);
    padding: 10px 8px;
    font-size: 9px;
    font-weight: 600;
    font-family: var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 2px;
    transition: all 0.15s ease;
}

.action-btn:hover {
    background: var(--surface);
    border-color: var(--amber);
}

.finding-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.finding-item {
    width: 100%;
    background: transparent;
    padding: 10px 8px;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle);
    transition: background 0.12s ease;
}

.finding-item:hover { background: rgba(26, 23, 20, 0.65); }

.finding-row {
    display: grid;
    grid-template-columns: 16px 1fr auto;
    gap: 10px;
    align-items: center;
}

.finding-severity {
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.finding-title {
    color: var(--white);
    font-size: 12px;
    font-weight: 500;
}

.finding-location {
    font-family: var(--font-mono);
    color: var(--grey-dim);
    font-size: 9px;
    text-align: right;
}

.empty-state {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 2px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    color: var(--amber);
    margin-bottom: 16px;
}

.empty-title {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 22px;
    color: var(--white);
    margin-bottom: 8px;
}

.empty-copy-text {
    color: var(--grey);
    font-size: 12px;
    font-weight: 300;
    max-width: 280px;
    line-height: 1.6;
}
`;

export function buildWebviewStyles(panel: 'sidebar' | 'findings'): string {
    if (panel === 'findings') {
        return `${BASE}${FINDINGS}`;
    }
    return `${BASE}${SIDEBAR}`;
}

export function severityColor(severity: string): string {
    switch (severity.toLowerCase()) {
        case 'critical':
        case 'high':
            return '#D4762A';
        case 'medium':
            return '#C4701F';
        case 'low':
        case 'clean':
            return '#7A9970';
        default:
            return '#4A4440';
    }
}
