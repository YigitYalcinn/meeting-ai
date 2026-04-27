type DerivedInsight = {
  label: string;
  tone: "neutral" | "risk";
};

const DECISION_PATTERNS = [
  /decision/i,
  /agreed/i,
  /selected/i,
  /approved/i,
  /will\b/i,
  /plan\b/i,
];

const RISK_PATTERNS = [
  /risk/i,
  /blocker/i,
  /warning/i,
  /critical/i,
  /drop/i,
  /delay/i,
  /issue/i,
  /slip/i,
];

function dedupe(values: DerivedInsight[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.label.trim().toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function deriveDecisionHighlights(keyPoints: string[]) {
  const decisions = keyPoints
    .filter((point) => DECISION_PATTERNS.some((pattern) => pattern.test(point)))
    .map((point) => ({
      label: point,
      tone: "neutral" as const,
    }));

  return dedupe(decisions).slice(0, 3);
}

export function deriveRiskHighlights(keyPoints: string[]) {
  const risks = keyPoints
    .filter((point) => RISK_PATTERNS.some((pattern) => pattern.test(point)))
    .map((point) => ({
      label: point,
      tone: "risk" as const,
    }));

  return dedupe(risks).slice(0, 3);
}
