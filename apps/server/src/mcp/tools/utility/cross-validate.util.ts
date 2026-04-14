import type { VulnerabilityFinding } from '../types';

export type SecondaryLlmFn = (prompt: string) => Promise<string>;

function buildPrompt(
  code: string,
  language: string,
  findings: VulnerabilityFinding[],
): string {
  return `
You are an adversarial security reviewer. A primary AI model has scanned the following ${language} code and produced a vulnerability report. Your job is to challenge that report rigorously.

## Your responsibilities
1. **Remove false positives** — if a finding is incorrect or inapplicable to this code, omit it.
2. **Upgrade or downgrade severity** — if a finding's severity is wrong, correct it.
3. **Add missed vulnerabilities** — if the primary model missed something real, add it.
4. **Keep confirmed findings** — if a finding is accurate, include it unchanged.

## Code under review
\`\`\`${language}
${code}
\`\`\`

## Primary model findings
${JSON.stringify(findings, null, 2)}

## Output format
Return ONLY a valid JSON array. No markdown, no explanation, no wrapper text — just the raw JSON array.
Each item in the array must have exactly these fields:
- "category"      (string)  — OWASP category name
- "title"         (string)  — short vulnerability title
- "severity"      (string)  — one of: "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"
- "lineNumber"    (number | null) — source line number if identifiable, otherwise null
- "description"   (string)  — why this is dangerous
- "fixSuggestion" (string)  — concrete, actionable fix recommendation

If the code is clean after your review, return an empty array: []
`.trim();
}

function parseResponse(
  text: string,
  fallback: VulnerabilityFinding[],
): VulnerabilityFinding[] {
  try {
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const match = stripped.match(/\[[\s\S]*\]/);
    if (!match) return fallback;

    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return fallback;

    const VALID_SEVERITIES = new Set([
      'CRITICAL',
      'HIGH',
      'MEDIUM',
      'LOW',
      'INFO',
    ]);

    const validated: VulnerabilityFinding[] = parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null,
      )
      .map((item) => ({
        category: String(item['category'] ?? 'Unknown'),
        title: String(item['title'] ?? 'Unnamed vulnerability'),
        severity: VALID_SEVERITIES.has(String(item['severity']))
          ? (String(item['severity']) as VulnerabilityFinding['severity'])
          : 'MEDIUM',
        lineNumber:
          typeof item['lineNumber'] === 'number' ? item['lineNumber'] : null,
        description: String(item['description'] ?? ''),
        fixSuggestion: String(item['fixSuggestion'] ?? ''),
      }))
      .filter((f) => f.title.length > 0 && f.description.length > 0);

    return validated;
  } catch {
    return fallback;
  }
}

export async function crossValidate(
  secondaryLlm: SecondaryLlmFn,
  code: string,
  language: string,
  findings: VulnerabilityFinding[],
): Promise<VulnerabilityFinding[]> {
  if (findings.length === 0) return [];

  const prompt = buildPrompt(code, language, findings);

  try {
    const response = await secondaryLlm(prompt);
    return parseResponse(response, findings);
  } catch {
    return findings;
  }
}
