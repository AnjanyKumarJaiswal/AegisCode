import type {
  McpTool,
  ScanContext,
  VulnerabilityFinding,
  FindingSeverity,
} from '../types';

const FINDING_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description:
        'Short vulnerability title, e.g. "SQL Injection in login query"',
    },
    severity: {
      type: 'string',
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'],
      description: 'Risk severity of this finding',
    },
    lineNumber: {
      type: 'number',
      description:
        'Source line number where the issue was found, if identifiable',
    },
    description: {
      type: 'string',
      description: 'Detailed explanation of why this is dangerous',
    },
    fixSuggestion: {
      type: 'string',
      description:
        'Concrete, actionable recommendation for fixing this vulnerability',
    },
  },
  required: ['title', 'severity', 'description', 'fixSuggestion'],
};

const FINDINGS_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      description:
        'All vulnerabilities you found in this category. ' +
        'Pass an empty array if the code is clean for this category — do NOT skip calling the tool.',
      items: FINDING_ITEM_SCHEMA,
    },
  },
  required: ['findings'],
};

interface OwaspCategoryConfig {
  name: string;
  category: string;
  owasp: string;
  description: string;
}

const OWASP_CATEGORIES: OwaspCategoryConfig[] = [
  {
    name: 'check_broken_access_control',
    category: 'Broken Access Control',
    owasp: 'A01:2021',
    description:
      'Check for OWASP A01 — Broken Access Control. ' +
      'Look for: missing authorisation checks before resource access, ' +
      'insecure direct object references (IDOR) where user-supplied IDs are used without ownership validation, ' +
      'path traversal vulnerabilities (e.g. "../" in file paths), ' +
      'privilege escalation opportunities where a lower-privileged user can perform admin actions, ' +
      'CORS misconfiguration allowing untrusted origins, ' +
      'metadata exposure through directory listings or unprotected API routes, ' +
      'and forceful browsing to pages that should require authentication.',
  },
  {
    name: 'check_cryptographic_failures',
    category: 'Cryptographic Failures',
    owasp: 'A02:2021',
    description:
      'Check for OWASP A02 — Cryptographic Failures. ' +
      'Look for: hardcoded secrets, API keys, passwords, or tokens in source code, ' +
      'use of weak or broken hashing algorithms (MD5, SHA1) for passwords or sensitive data, ' +
      'insecure pseudo-random number generation (e.g. Math.random() for security tokens), ' +
      'sensitive data transmitted without encryption (plain HTTP), ' +
      'sensitive data stored without encryption or with reversible encoding (e.g. base64), ' +
      'and use of deprecated cryptographic functions or cipher modes (e.g. ECB mode, DES, RC4).',
  },
  {
    name: 'check_injection',
    category: 'Injection',
    owasp: 'A03:2021',
    description:
      'Check for OWASP A03 — Injection. ' +
      'Look for: SQL injection via string concatenation or unparameterised queries, ' +
      'NoSQL injection through unsanitised filter objects, ' +
      'OS command injection where user input reaches exec/spawn/system calls, ' +
      'LDAP injection in directory queries, ' +
      'XPath injection in XML queries, ' +
      'server-side template injection (SSTI) where user input is rendered in templates, ' +
      'reflected, stored, or DOM-based cross-site scripting (XSS) where unsanitised input reaches HTML output, ' +
      'and any other case where unsanitised user input is passed directly to an interpreter.',
  },
  {
    name: 'check_insecure_design',
    category: 'Insecure Design',
    owasp: 'A04:2021',
    description:
      'Check for OWASP A04 — Insecure Design. ' +
      'Look for: missing rate limiting on sensitive endpoints (login, password reset, OTP), ' +
      'business logic flaws such as skippable payment or verification steps, ' +
      'missing or insufficient input validation on critical operations, ' +
      'insecure state machine design where steps can be reached out of order, ' +
      'trust boundary violations where data crosses trust levels without re-validation, ' +
      'absence of anti-automation controls on sensitive forms, ' +
      'and design patterns that make security controls trivially bypassable.',
  },
  {
    name: 'check_security_misconfiguration',
    category: 'Security Misconfiguration',
    owasp: 'A05:2021',
    description:
      'Check for OWASP A05 — Security Misconfiguration. ' +
      'Look for: default credentials still present, ' +
      'verbose error messages or stack traces exposed to clients, ' +
      'unnecessary features, services, or endpoints left enabled, ' +
      'missing or incorrectly configured security headers (CSP, HSTS, X-Frame-Options), ' +
      'debug mode or development flags left active in production code, ' +
      'insecure default configurations not hardened for production, ' +
      'and XML external entity (XXE) processing left enabled.',
  },
  {
    name: 'check_vulnerable_components',
    category: 'Vulnerable and Outdated Components',
    owasp: 'A06:2021',
    description:
      'Check for OWASP A06 — Vulnerable and Outdated Components. ' +
      'Look for: use of deprecated API methods or functions with known CVEs, ' +
      'clearly outdated library usage patterns (e.g. legacy jQuery selectors, old crypto APIs), ' +
      'use of functions that have well-known security issues such as eval(), innerHTML, document.write(), ' +
      'direct buffer manipulation without bounds checking, ' +
      'and references to unmaintained or abandoned packages or modules.',
  },
  {
    name: 'check_auth_failures',
    category: 'Identification and Authentication Failures',
    owasp: 'A07:2021',
    description:
      'Check for OWASP A07 — Identification and Authentication Failures. ' +
      'Look for: weak or absent password strength enforcement, ' +
      'missing account lockout or brute-force protection on login, ' +
      'insecure session token generation (short, predictable, or non-random tokens), ' +
      'missing session expiry or token rotation after privilege changes, ' +
      'JWT vulnerabilities (accepting the "none" algorithm, weak signing secrets, missing signature validation), ' +
      'authentication tokens or session IDs exposed in URLs or log output, ' +
      'and insecure "remember me" or persistent login implementations.',
  },
  {
    name: 'check_integrity_failures',
    category: 'Software and Data Integrity Failures',
    owasp: 'A08:2021',
    description:
      'Check for OWASP A08 — Software and Data Integrity Failures. ' +
      'Look for: unsafe deserialisation where untrusted data is passed to deserialisation functions, ' +
      'use of eval(), new Function(), or setTimeout/setInterval with string arguments containing user input, ' +
      'prototype pollution vulnerabilities where object properties can be injected via user-controlled keys, ' +
      'missing integrity checks (SRI hashes) on externally loaded scripts or stylesheets, ' +
      'and auto-update mechanisms that fetch and execute code without signature verification.',
  },
  {
    name: 'check_logging_failures',
    category: 'Security Logging and Monitoring Failures',
    owasp: 'A09:2021',
    description:
      'Check for OWASP A09 — Security Logging and Monitoring Failures. ' +
      'Look for: absence of logging on authentication events (login, logout, failed attempts), ' +
      'sensitive data being written to logs (passwords, tokens, PII, credit card numbers), ' +
      'caught exceptions that are silently swallowed, hiding security-relevant errors, ' +
      'missing audit trails on destructive or high-value operations (delete, transfer, admin actions), ' +
      'and log statements that expose internal system details useful to an attacker.',
  },
  {
    name: 'check_ssrf',
    category: 'Server-Side Request Forgery',
    owasp: 'A10:2021',
    description:
      'Check for OWASP A10 — Server-Side Request Forgery (SSRF). ' +
      'Look for: user-controlled URLs or hostnames being used in server-side HTTP requests without validation, ' +
      'missing allowlist or denylist for permitted outbound request destinations, ' +
      'URL redirection without validating the destination against a trusted list, ' +
      'internal service URLs (localhost, 169.254.x.x, 10.x.x.x) reachable via user-supplied parameters, ' +
      'and file:// or other dangerous URI schemes accepted in URL inputs.',
  },
];

const VALID_SEVERITIES = new Set<string>([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFO',
]);

function normaliseSeverity(raw: unknown): FindingSeverity {
  const s = String(raw ?? '').toUpperCase();
  return VALID_SEVERITIES.has(s) ? (s as FindingSeverity) : 'MEDIUM';
}

function parseFindings(
  rawFindings: unknown,
  category: string,
): VulnerabilityFinding[] {
  if (!Array.isArray(rawFindings)) return [];

  return rawFindings
    .filter(
      (f): f is Record<string, unknown> => typeof f === 'object' && f !== null,
    )
    .map((f) => ({
      category,
      title: String(f['title'] ?? 'Unnamed vulnerability'),
      severity: normaliseSeverity(f['severity']),
      lineNumber: typeof f['lineNumber'] === 'number' ? f['lineNumber'] : null,
      description: String(f['description'] ?? ''),
      fixSuggestion: String(f['fixSuggestion'] ?? ''),
    }));
}

function createOwaspTool(config: OwaspCategoryConfig): McpTool {
  return {
    definition: {
      name: config.name,
      description: config.description,
      inputSchema: FINDINGS_INPUT_SCHEMA,
    },

    handler: async (
      args: Record<string, unknown>,
      ctx: ScanContext,
    ): Promise<unknown> => {
      const parsed = parseFindings(args['findings'], config.category);
      ctx.findings.push(...parsed);

      return {
        category: config.category,
        owasp: config.owasp,
        received: parsed.length,
        message:
          parsed.length === 0
            ? `No ${config.category} vulnerabilities detected.`
            : `Recorded ${parsed.length} ${config.category} finding(s).`,
      };
    },
  };
}

export const owaspCheckTools: McpTool[] = OWASP_CATEGORIES.map(createOwaspTool);

export const owaspToolDefinitions = owaspCheckTools.map((t) => t.definition);
