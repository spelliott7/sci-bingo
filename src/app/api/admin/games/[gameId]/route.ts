import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  return NextResponse.json({ game });
}

const schema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  venmoHandle: z.string().trim().max(60).nullable().optional(),
  winnerCardIds: z.array(z.string()).optional(),
  winnerEntryIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update." },
      { status: 400 },
    );
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  if (parsed.data.status === "ACTIVE" && game.status !== "ACTIVE") {
    const existingActive = await prisma.game.findFirst({
      where: { status: "ACTIVE", type: game.type, id: { not: game.id } },
    });
    if (existingActive) {
      return NextResponse.json(
        { error: `"${existingActive.name}" is already active. Complete it first.` },
        { status: 409 },
      );
    }
  }

  let winnerCardIds: string[] | undefined = undefined;
  let winnerEntryIds: string[] | undefined = undefined;

  if (parsed.data.status === "COMPLETED") {
    const winnerKey = game.type === "BINGO" ? "winnerCardIds" : "winnerEntryIds";
    if (!rawBody || typeof rawBody !== "object" || !(winnerKey in rawBody)) {
      return NextResponse.json(
        { error: "Select the winner(s) (or confirm no winner) before completing the game." },
        { status: 400 },
      );
    }

    if (game.type === "BINGO") {
      winnerCardIds = parsed.data.winnerCardIds ?? [];
      if (winnerCardIds.length > 0) {
        const count = await prisma.bingoCard.count({
          where: { id: { in: winnerCardIds }, gameId: game.id },
        });
        if (count !== winnerCardIds.length) {
          return NextResponse.json(
            { error: "One or more selected cards aren't part of this game." },
            { status: 400 },
          );
        }
      }
    } else {
      winnerEntryIds = parsed.data.winnerEntryIds ?? [];
      if (winnerEntryIds.length > 0) {
        const count = await prisma.pick3Entry.count({
          where: { id: { in: winnerEntryIds }, gameId: game.id },
        });
        if (count !== winnerEntryIds.length) {
          return NextResponse.json(
            { error: "One or more selected entries aren't part of this game." },
            { status: 400 },
          );
        }
      }
    }
  }

  const updated = await prisma.game.update({
    where: { id: game.id },
    data: {
      status: parsed.data.status,
      name: parsed.data.name,
      venmoHandle:
        parsed.data.venmoHandle === undefined ? undefined : parsed.data.venmoHandle || null,
      winnerCardIds,
      winnerEntryIds,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ game: updated });
}
