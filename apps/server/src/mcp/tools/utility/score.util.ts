import type { VulnerabilityFinding, FindingSeverity } from '../types';

const SEVERITY_WEIGHTS: Record<FindingSeverity, number> = {
  CRITICAL: 3.0,
  HIGH: 1.5,
  MEDIUM: 0.5,
  LOW: 0.2,
  INFO: 0.05,
};

export function calculateScore(findings: VulnerabilityFinding[]): number {
  if (findings.length === 0) return 10.0;

  const penalty = findings.reduce(
    (acc, finding) => acc + SEVERITY_WEIGHTS[finding.severity],
    0,
  );

  const score = 10.0 - penalty;
  const rounded = Math.round(score * 10) / 10;
  return Math.max(1.0, rounded);
}

export function scoreLabel(score: number): string {
  if (score >= 9.0) return 'Clean';
  if (score >= 7.0) return 'Low Risk';
  if (score >= 5.0) return 'Moderate Risk';
  if (score >= 3.0) return 'High Risk';
  return 'Critical Risk';
}
