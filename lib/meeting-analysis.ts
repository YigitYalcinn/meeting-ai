type MeetingActionItem = {
  title: string;
  owner: string | null;
  dueDate: string | null;
};

function parseJsonValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function getMeetingKeyPoints(value: unknown): string[] {
  const parsedValue = parseJsonValue(value);

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue.filter((item): item is string => typeof item === "string");
}

export function getMeetingActionItems(value: unknown): MeetingActionItem[] {
  const parsedValue = parseJsonValue(value);

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue.filter((item): item is MeetingActionItem => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Record<string, unknown>;

    return (
      typeof candidate.title === "string" &&
      (typeof candidate.owner === "string" || candidate.owner === null) &&
      (typeof candidate.dueDate === "string" || candidate.dueDate === null)
    );
  });
}
