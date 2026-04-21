const allowedSourceTypes = ["manual", "text_file", "audio_file"] as const;
const allowedMeetingStatuses = ["ready", "pending_transcription"] as const;
const allowedTextFileExtensions = [".txt", ".md"] as const;
const allowedAudioFileExtensions = [".mp3", ".wav", ".m4a"] as const;

export type MeetingSourceType = (typeof allowedSourceTypes)[number];
export type MeetingStatus = (typeof allowedMeetingStatuses)[number];

type ValidationSuccess = {
  success: true;
  data: {
    title: string;
    sourceType: MeetingSourceType;
    status: MeetingStatus;
    rawText: string | null;
    originalFileName: string | null;
    mimeType: string | null;
    storedFilePath: string | null;
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
    errors.push("Source type must be one of: manual, text_file, audio_file.");
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
      status: "ready",
      rawText: normalizedRawText,
      originalFileName: null,
      mimeType: null,
      storedFilePath: null,
    },
  };
}

export function validateMeetingTitle(title: unknown): string | null {
  if (typeof title !== "string" || title.trim().length === 0) {
    return null;
  }

  return title.trim();
}

export function isSupportedTextFile(filename: string): boolean {
  const normalizedName = filename.toLowerCase();

  return allowedTextFileExtensions.some((extension) =>
    normalizedName.endsWith(extension),
  );
}

export function isSupportedAudioFile(filename: string): boolean {
  const normalizedName = filename.toLowerCase();

  return allowedAudioFileExtensions.some((extension) =>
    normalizedName.endsWith(extension),
  );
}

export {
  allowedAudioFileExtensions,
  allowedMeetingStatuses,
  allowedSourceTypes,
  allowedTextFileExtensions,
};
