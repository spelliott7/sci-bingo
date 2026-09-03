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
  winnerCardId: z.string().nullable().optional(),
  winnerEntryId: z.string().nullable().optional(),
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

  let winnerCardId: string | null | undefined = undefined;
  let winnerEntryId: string | null | undefined = undefined;

  if (parsed.data.status === "COMPLETED") {
    const winnerKey = game.type === "BINGO" ? "winnerCardId" : "winnerEntryId";
    if (!rawBody || typeof rawBody !== "object" || !(winnerKey in rawBody)) {
      return NextResponse.json(
        { error: "Select a winner (or confirm no winner) before completing the game." },
        { status: 400 },
      );
    }

    if (game.type === "BINGO") {
      winnerCardId = parsed.data.winnerCardId ?? null;
      if (winnerCardId) {
        const card = await prisma.bingoCard.findUnique({ where: { id: winnerCardId } });
        if (!card || card.gameId !== game.id) {
          return NextResponse.json({ error: "That card isn't part of this game." }, { status: 400 });
        }
      }
    } else {
      winnerEntryId = parsed.data.winnerEntryId ?? null;
      if (winnerEntryId) {
        const entry = await prisma.pick3Entry.findUnique({ where: { id: winnerEntryId } });
        if (!entry || entry.gameId !== game.id) {
          return NextResponse.json({ error: "That entry isn't part of this game." }, { status: 400 });
        }
      }
    }
  }

  const updated = await prisma.game.update({
    where: { id: game.id },
    data: {
      status: parsed.data.status,
      name: parsed.data.name,
      winnerCardId,
      winnerEntryId,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ game: updated });
}
