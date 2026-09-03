import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

  const { username, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    const field = existing.username === username ? "username" : "email";
    return NextResponse.json({ error: `That ${field} is already taken.` }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

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
