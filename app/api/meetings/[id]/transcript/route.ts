import { getCurrentUser } from "@/lib/auth";
import { getOpenAIClient } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import {
  getStoredFileBuffer,
  storedFileExists,
} from "@/lib/uploads";

type TranscriptRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function getTranscriptionProvider() {
  return process.env.TRANSCRIPTION_PROVIDER === "openai"
    ? "openai"
    : "mock";
}

function buildMockTranscript(meetingTitle: string, originalFileName: string | null) {
  const fileLabel = originalFileName || "the uploaded audio file";

  return [
    `[Mock transcript for "${meetingTitle}"]`,
    "",
    `This transcript was generated locally for development from ${fileLabel}.`,
    "It lets you continue building the product flow without paying for a transcription API.",
    "",
    "Example transcript content:",
    "Team reviewed meeting goals, discussed current blockers, and agreed on next steps.",
    "A real transcription provider can replace this mock later without changing the rest of the app flow.",
  ].join("\n");
}

export async function POST(
  _request: Request,
  { params }: TranscriptRouteProps,
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const meeting = await prisma.meeting.findFirst({
      where: { id, userId: user.id },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found." }, { status: 404 });
    }

    if (meeting.sourceType !== "audio_file") {
      return Response.json(
        { error: "Only audio meetings can be transcribed." },
        { status: 400 },
      );
    }

    if (!meeting.storedFilePath) {
      return Response.json(
        { error: "No stored audio file was found for this meeting." },
        { status: 400 },
      );
    }

    const fileExists = await storedFileExists(meeting.storedFilePath);

    if (!fileExists) {
      await prisma.meeting.update({
        where: { id },
        data: {
          status: "transcription_failed",
          transcriptionError: "Stored audio file could not be found.",
        },
      });

      return Response.json(
        { error: "Stored audio file could not be found." },
        { status: 400 },
      );
    }

    await prisma.meeting.update({
      where: { id },
      data: {
        status: "transcribing",
        transcriptionError: null,
      },
    });

    let transcriptText = "";
    const transcriptionProvider = getTranscriptionProvider();

    if (transcriptionProvider === "openai") {
      const openai = getOpenAIClient();

      if (!openai) {
        await prisma.meeting.update({
          where: { id },
          data: {
            status: "transcription_failed",
            transcriptionError:
              "OPENAI_API_KEY is missing while TRANSCRIPTION_PROVIDER is set to openai.",
          },
        });

        return Response.json(
          {
            error:
              "OPENAI_API_KEY is missing while TRANSCRIPTION_PROVIDER is set to openai.",
          },
          { status: 500 },
        );
      }

      const fileBuffer = await getStoredFileBuffer(meeting.storedFilePath);
      const transcriptionFile = new File(
        [fileBuffer],
        meeting.originalFileName || "audio-upload",
        {
          type: meeting.mimeType || "application/octet-stream",
        },
      );
      const transcriptResponse = await openai.audio.transcriptions.create({
        file: transcriptionFile,
        model: "gpt-4o-transcribe",
      });

      transcriptText =
        typeof transcriptResponse.text === "string"
          ? transcriptResponse.text.trim()
          : "";
    } else {
      transcriptText = buildMockTranscript(
        meeting.title,
        meeting.originalFileName,
      ).trim();
    }

    if (!transcriptText) {
      await prisma.meeting.update({
        where: { id },
        data: {
          status: "transcription_failed",
          transcriptionError: "The transcription returned empty text.",
        },
      });

      return Response.json(
        { error: "The transcription returned empty text." },
        { status: 500 },
      );
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        status: "ready",
        transcript: transcriptText,
        transcriptionError: null,
        processedAt: new Date(),
      },
    });

    return Response.json(updatedMeeting);
  } catch (error) {
    console.error("Failed to generate transcript:", error);

    await prisma.meeting.update({
      where: { id },
      data: {
        status: "transcription_failed",
        transcriptionError:
          error instanceof Error ? error.message : "Unknown transcription error.",
      },
    });

    return Response.json(
      { error: "Failed to generate transcript." },
      { status: 500 },
    );
  }
}
