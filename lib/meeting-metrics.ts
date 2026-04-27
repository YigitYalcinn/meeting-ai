export type MeetingMetric = {
  label: string;
  value: string;
  numericValue: number | null;
  context: string;
};

function parseNumericValue(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function buildMetric(
  label: string,
  rawValue: string,
  suffix: string,
  context: string,
): MeetingMetric {
  return {
    label,
    value: `${rawValue}${suffix}`,
    numericValue: parseNumericValue(rawValue),
    context,
  };
}

export function extractMeetingMetrics(text: string | null | undefined) {
  if (!text) {
    return [];
  }

  const metrics: MeetingMetric[] = [];

  const patterns: Array<{
    label: string;
    regex: RegExp;
    suffix: string;
    context: string;
  }> = [
    {
      label: "Activation Rate",
      regex: /(?:activation rate|aktivasyon oranı)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*%/i,
      suffix: "%",
      context: "Product adoption signal",
    },
    {
      label: "Setup Completion",
      regex:
        /(?:setup completion rate|kurulum tamamlama oranı)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*%/i,
      suffix: "%",
      context: "Onboarding completion",
    },
    {
      label: "Team Invite Completion",
      regex:
        /(?:team invite completion rate|ekip daveti tamamlama oranı)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*%/i,
      suffix: "%",
      context: "Collaboration step conversion",
    },
    {
      label: "NPS",
      regex: /(?:nps)\s*[:=-]?\s*(-?\d+(?:[.,]\d+)?)/i,
      suffix: "",
      context: "Customer sentiment",
    },
    {
      label: "Support Tickets",
      regex:
        /(?:support tickets|destek talebi(?: sayısı)?)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i,
      suffix: "",
      context: "Support volume",
    },
    {
      label: "Time to First Value",
      regex:
        /(?:time to first value|ilk değer süresi)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*(?:gün|day|days|saat|hours?)/i,
      suffix: " d",
      context: "Speed to activation",
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);

    if (!match?.[1]) {
      continue;
    }

    metrics.push(
      buildMetric(pattern.label, match[1], pattern.suffix, pattern.context),
    );
  }

  return metrics.slice(0, 4);
}
