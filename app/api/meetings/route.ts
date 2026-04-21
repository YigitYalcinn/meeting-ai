import { mkdir } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploads";
import {
  isSupportedAudioFile,
  isSupportedTextFile,
  validateMeetingInput,
  validateMeetingTitle,
} from "@/lib/validations/meeting";

async function handleMultipartMeetingRequest(request: Request) {
  const formData = await request.formData();
  const title = validateMeetingTitle(formData.get("title"));
  const sourceType = formData.get("sourceType");
  const rawTextValue = formData.get("rawText");
  const uploadedFile = formData.get("file");
  const errors: string[] = [];

  if (!title) {
    errors.push("Title is required.");
  }

  if (
    sourceType !== "manual" &&
    sourceType !== "text_file" &&
    sourceType !== "audio_file"
  ) {
    errors.push("Please choose a valid input mode.");
  }

  if (sourceType === "manual") {
    if (
      typeof rawTextValue !== "string" ||
      rawTextValue.trim().length === 0
    ) {
      errors.push("Meeting notes are required for manual text input.");
    }
  }

  if (sourceType === "text_file" || sourceType === "audio_file") {
    if (!(uploadedFile instanceof File) || uploadedFile.size === 0) {
      errors.push("Please upload a file.");
    }
  }

  if (errors.length > 0) {
    return Response.json({ errors }, { status: 400 });
  }

  const validatedTitle = title as string;
  const validatedSourceType = sourceType as
    | "manual"
    | "text_file"
    | "audio_file";

  if (validatedSourceType === "manual") {
    const meeting = await prisma.meeting.create({
      data: {
        title: validatedTitle,
        sourceType: validatedSourceType,
        status: "ready",
        rawText:
          typeof rawTextValue === "string" ? rawTextValue.trim() || null : null,
      },
    });

    return Response.json(meeting, { status: 201 });
  }

  const file = uploadedFile as File;
  const uploadsRoot = path.join(process.cwd(), "uploads");
  await mkdir(uploadsRoot, { recursive: true });

  if (validatedSourceType === "text_file") {
    if (!isSupportedTextFile(file.name)) {
      return Response.json(
        { errors: ["Text uploads currently support .txt and .md files only."] },
        { status: 400 },
      );
    }

    const storedFile = await saveUploadedFile(file);
    const extractedText = storedFile.buffer.toString("utf8").trim();

    if (extractedText.length === 0) {
      return Response.json(
        { errors: ["The uploaded text file is empty."] },
        { status: 400 },
      );
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: validatedTitle,
        sourceType: validatedSourceType,
        status: "ready",
        rawText: extractedText,
        originalFileName: storedFile.originalFileName,
        mimeType: storedFile.mimeType,
        storedFilePath: storedFile.storedFilePath,
      },
    });

    return Response.json(meeting, { status: 201 });
  }

  if (!isSupportedAudioFile(file.name)) {
    return Response.json(
      { errors: ["Audio uploads currently support .mp3, .wav, and .m4a files only."] },
      { status: 400 },
    );
  }

  const storedFile = await saveUploadedFile(file);
  const meeting = await prisma.meeting.create({
    data: {
      title: validatedTitle,
      sourceType: validatedSourceType,
      status: "pending_transcription",
      rawText: null,
      originalFileName: storedFile.originalFileName,
      mimeType: storedFile.mimeType,
      storedFilePath: storedFile.storedFilePath,
    },
  });

  return Response.json(meeting, { status: 201 });
}

export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(meetings);
  } catch (error) {
    console.error("Failed to fetch meetings:", error);

    return Response.json(
      { error: "Failed to fetch meetings." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return await handleMultipartMeetingRequest(request);
    }

    const body = await request.json();
    const validationResult = validateMeetingInput(body);

    if (!validationResult.success) {
      return Response.json(
        { errors: validationResult.errors },
        { status: 400 },
      );
    }

    const meeting = await prisma.meeting.create({
      data: validationResult.data,
    });

    return Response.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting:", error);

    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "Failed to create meeting." },
      { status: 500 },
    );
  }
}
