import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "meeting_ai_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_KEY_LENGTH = 64;

function shouldUseSecureCookie(request?: Request) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (process.env.AUTH_COOKIE_SECURE === "false") {
    return false;
  }

  if (process.env.AUTH_COOKIE_SECURE === "true") {
    return true;
  }

  const forwardedProto = request?.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  return request ? new URL(request.url).protocol === "https:" : true;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const candidateHash = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  if (candidateHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, storedHashBuffer);
}

export async function createSession(userId: string, request?: Request) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({
        where: {
          id: session.id,
        },
      });
    }

    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return user;
}
