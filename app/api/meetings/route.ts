import { prisma } from "@/lib/prisma";
import { validateMeetingInput } from "@/lib/validations/meeting";

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
