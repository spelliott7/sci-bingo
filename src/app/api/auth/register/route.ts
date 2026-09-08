import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { SESSION_COOKIE, signSessionToken } from "@/lib/session";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username needs to be at least 3 characters.")
    .max(24, "Username needs to be 24 characters or fewer.")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only."),
  name: z
    .string()
    .trim()
    .min(1, "Enter your name (first name, last initial).")
    .max(40, "Keep it to 40 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password needs to be at least 8 characters."),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { username, name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: { equals: username, mode: "insensitive" } }, { email }],
    },
  });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    return NextResponse.json({ error: `That ${field} is already taken.` }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await prisma.user.create({
      data: { username, name, email, passwordHash },
    });
  } catch (err) {
    // Race: two people registering the same username (any case) at once —
    // the DB's case-insensitive unique index catches what the check above
    // might not.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    throw err;
  }

  const token = await signSessionToken({ sub: user.id, username: user.username, role: user.role });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
