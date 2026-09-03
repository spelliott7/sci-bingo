import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE, signSessionToken } from "@/lib/session";

const schema = z.object({
  nickname: z.string().trim().min(1, "Enter your admin nickname."),
  password: z.string().min(1, "Enter your password."),
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

  const { nickname, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username: nickname } });

  if (!user || user.role !== "ADMIN" || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Wrong nickname or password." }, { status: 401 });
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
