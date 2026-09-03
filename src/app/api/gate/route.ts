import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GATE_COOKIE, signGateToken } from "@/lib/session";

const schema = z.object({
  keyword: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the keyword and password." }, { status: 400 });
  }

  const expectedKeyword = process.env.GATE_KEYWORD ?? "";
  const expectedPassword = process.env.GATE_PASSWORD ?? "";

  const ok =
    parsed.data.keyword.trim().toLowerCase() === expectedKeyword.trim().toLowerCase() &&
    parsed.data.password === expectedPassword;

  if (!ok) {
    return NextResponse.json({ error: "That keyword/password combo isn't right." }, { status: 401 });
  }

  const token = await signGateToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
