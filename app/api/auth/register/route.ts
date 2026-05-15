import { Prisma } from "@prisma/client";

import { createSession, hashPassword, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
        email: true,
      },
    });
    const userCount = await prisma.user.count();

    if (userCount === 1) {
      await prisma.meeting.updateMany({
        where: {
          userId: null,
        },
        data: {
          userId: user.id,
        },
      });
    }

    await createSession(user.id, request);

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Failed to register:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code:
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code
          : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return Response.json({ error: "Failed to create account." }, { status: 500 });
  }
}
