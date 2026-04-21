import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";

type MeetingAnalysisRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type AnalysisActionItem = {
  title: string;
  owner: string | null;
  dueDate: string | null;
};

type AnalysisResponse = {
  summary: string;
  keyPoints: string[];
  actionItems: AnalysisActionItem[];
};

const analysisSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A concise meeting summary written for a product dashboard.",
    },
    keyPoints: {
      type: "array",
      description: "Main discussion points from the meeting.",
      items: {
        type: "string",
      },
    },
    actionItems: {
      type: "array",
      description: "Structured action items extracted from the meeting.",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          owner: {
            type: ["string", "null"],
          },
          dueDate: {
            type: ["string", "null"],
          },
        },
        required: ["title", "owner", "dueDate"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "keyPoints", "actionItems"],
  additionalProperties: false,
} as const;

function getMeetingSourceText(meeting: {
  sourceType: string;
  rawText: string | null;
  transcript: string | null;
}) {
  if (meeting.sourceType === "audio_file") {
    return meeting.transcript?.trim() || null;
  }

  return meeting.rawText?.trim() || null;
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.summary !== "string") {
    return false;
  }

  if (
    !Array.isArray(candidate.keyPoints) ||
    !candidate.keyPoints.every((item) => typeof item === "string")
  ) {
    return false;
  }

  if (!Array.isArray(candidate.actionItems)) {
    return false;
  }

  return candidate.actionItems.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const actionItem = item as Record<string, unknown>;

    return (
      typeof actionItem.title === "string" &&
      (typeof actionItem.owner === "string" || actionItem.owner === null) &&
      (typeof actionItem.dueDate === "string" || actionItem.dueDate === null)
    );
  });
}

export async function POST(
  _request: Request,
  { params }: MeetingAnalysisRouteProps,
) {
  const { id } = await params;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found." }, { status: 404 });
    }

    const sourceText = getMeetingSourceText(meeting);

    if (!sourceText) {
      await prisma.meeting.update({
        where: { id },
        data: {
          analysisError:
            "No usable meeting text was found. Add notes or generate a transcript first.",
        },
      });

      return Response.json(
        {
          error:
            "No usable meeting text was found. Add notes or generate a transcript first.",
        },
        { status: 400 },
      );
    }

    const openai = getOpenAIClient();

    if (!openai) {
      return Response.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 },
      );
    }

    await prisma.meeting.update({
      where: { id },
      data: {
        analysisError: null,
      },
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a meeting analysis assistant. Return structured JSON only. Keep the summary practical and concise. Extract useful key points and action items for a dashboard view.",
        },
        {
          role: "user",
          content: `Analyze this meeting content and return JSON that matches the provided schema.\n\nMeeting title: ${meeting.title}\n\nMeeting content:\n${sourceText}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "meeting_analysis",
          schema: analysisSchema,
          strict: true,
        },
      },
    });

    const parsedOutput = JSON.parse(response.output_text) as unknown;

    if (!isAnalysisResponse(parsedOutput)) {
      await prisma.meeting.update({
        where: { id },
        data: {
          analysisError: "The AI response was not in the expected format.",
        },
      });

      return Response.json(
        { error: "The AI response was not in the expected format." },
        { status: 500 },
      );
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        summary: parsedOutput.summary.trim(),
        keyPoints: parsedOutput.keyPoints,
        actionItems: parsedOutput.actionItems,
        analysisError: null,
        analyzedAt: new Date(),
      },
    });

    return Response.json(updatedMeeting);
  } catch (error) {
    console.error("Failed to generate AI analysis:", error);

    await prisma.meeting.update({
      where: { id },
      data: {
        analysisError:
          error instanceof Error ? error.message : "Unknown analysis error.",
      },
    });

    return Response.json(
      { error: "Failed to generate AI summary." },
      { status: 500 },
    );
  }
}
