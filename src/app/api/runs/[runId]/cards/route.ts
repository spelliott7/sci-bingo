import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CARD_SIZE, FREE_POSITION } from "@/lib/bingo";

const schema = z.object({
  playerName: z.string().trim().min(1, "Enter a name for this card.").max(60),
  squares: z
    .array(z.object({ position: z.number().int().min(0).max(24), songId: z.number().int() }))
    .length(CARD_SIZE - 1, "A card needs a song in every square (the center is free)."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid card." },
      { status: 400 },
    );
  }

  const { playerName, squares } = parsed.data;

  const positions = new Set(squares.map((s) => s.position));
  if (positions.has(FREE_POSITION) || positions.size !== squares.length) {
    return NextResponse.json({ error: "Invalid square positions." }, { status: 400 });
  }
  const expectedPositions = Array.from({ length: 25 }, (_, i) => i).filter(
    (p) => p !== FREE_POSITION,
  );
  if (!expectedPositions.every((p) => positions.has(p))) {
    return NextResponse.json({ error: "Every square needs a song." }, { status: 400 });
  }

  const songIds = squares.map((s) => s.songId);
  if (new Set(songIds).size !== songIds.length) {
    return NextResponse.json({ error: "Each song can only be used once per card." }, { status: 400 });
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }
  if (run.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This run isn't open for building cards right now." },
      { status: 400 },
    );
  }

  const existingCard = await prisma.bingoCard.findUnique({
    where: { runId_userId: { runId: run.id, userId: session.sub } },
  });
  if (existingCard) {
    return NextResponse.json({ error: "You already have a card for this run." }, { status: 409 });
  }

  const validSongCount = await prisma.song.count({ where: { id: { in: songIds } } });
  if (validSongCount !== songIds.length) {
    return NextResponse.json({ error: "One or more songs weren't recognized." }, { status: 400 });
  }

  const card = await prisma.bingoCard.create({
    data: {
      runId: run.id,
      userId: session.sub,
      playerName,
      squares: {
        create: [
          ...squares.map((s) => ({ position: s.position, songId: s.songId })),
          { position: FREE_POSITION, songId: null },
        ],
      },
    },
    include: { squares: true },
  });

  await prisma.payment.upsert({
    where: { runId_userId: { runId: run.id, userId: session.sub } },
    update: {},
    create: { runId: run.id, userId: session.sub, amountDue: run.entryFee },
  });

  return NextResponse.json({ card });
}
