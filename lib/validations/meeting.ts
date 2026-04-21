const allowedSourceTypes = ["manual"] as const;

export type MeetingSourceType = (typeof allowedSourceTypes)[number];

type ValidationSuccess = {
  success: true;
  data: {
    title: string;
    sourceType: MeetingSourceType;
    rawText: string | null;
  };
};

type ValidationError = {
  success: false;
  errors: string[];
};

export type MeetingValidationResult = ValidationSuccess | ValidationError;

export function validateMeetingInput(input: unknown): MeetingValidationResult {
  if (!input || typeof input !== "object") {
    return {
      success: false,
      errors: ["Request body must be a JSON object."],
    };
  }

  const { title, sourceType, rawText } = input as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof title !== "string" || title.trim().length === 0) {
    errors.push("Title is required.");
  }

  if (
    typeof sourceType !== "string" ||
    !allowedSourceTypes.includes(sourceType as MeetingSourceType)
  ) {
    errors.push("Source type must be 'manual'.");
  }

  if (
    rawText !== undefined &&
    rawText !== null &&
    typeof rawText !== "string"
  ) {
    errors.push("Raw text must be a string when provided.");
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  const validatedSourceType =
    typeof sourceType === "string"
      ? (sourceType as MeetingSourceType)
      : allowedSourceTypes[0];
  const normalizedRawText =
    typeof rawText === "string" ? rawText.trim() || null : null;

  return {
    success: true,
    data: {
      title: trimmedTitle,
      sourceType: validatedSourceType,
      rawText: normalizedRawText,
    },
  };
}

export { allowedSourceTypes };
