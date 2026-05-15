import { createSession, normalizeEmail, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const password = typeof body.password === "string" ? body.password : "";

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    await createSession(user.id, request);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Failed to login:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : undefined,
    });

    return Response.json({ error: "Failed to sign in." }, { status: 500 });
  }
}
