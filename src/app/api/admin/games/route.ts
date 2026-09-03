import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true, entries: true, shows: true } } },
  });
  return NextResponse.json({ games });
}

const schema = z.object({
  type: z.enum(["BINGO", "PICK3"]),
  name: z.string().trim().min(1, "Give the game a name.").max(120),
  entryFee: z.number().positive().optional(),
  venmoHandle: z.string().trim().max(60).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid game." },
      { status: 400 },
    );
  }

  const game = await prisma.game.create({
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      entryFee: parsed.data.entryFee ?? 10,
      venmoHandle: parsed.data.venmoHandle || null,
    },
  });

  return NextResponse.json({ game });
}
