import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CARD_SIZE, FREE_POSITION, FREE_SPACE_SONG_NAME } from "@/lib/bingo";
import { getEntryLockAt, getFreeSpaceSongId } from "@/lib/gameQueries";

const schema = z.object({
  playerName: z.string().trim().min(1, "Enter a name for this card.").max(60),
  squares: z
    .array(z.object({ position: z.number().int().min(0).max(24), songId: z.number().int() }))
    .length(CARD_SIZE - 1, "A card needs a song in every square (the center is free)."),
});

function validateSquares(
  squares: { position: number; songId: number }[],
  freeSpaceSongId: number | null,
) {
  const positions = new Set(squares.map((s) => s.position));
  if (positions.has(FREE_POSITION) || positions.size !== squares.length) {
    return "Invalid square positions.";
  }
  const expectedPositions = Array.from({ length: 25 }, (_, i) => i).filter(
    (p) => p !== FREE_POSITION,
  );
  if (!expectedPositions.every((p) => positions.has(p))) {
    return "Every square needs a song.";
  }
  const songIds = squares.map((s) => s.songId);
  if (new Set(songIds).size !== songIds.length) {
    return "Each song can only be used once per card.";
  }
  if (freeSpaceSongId !== null && songIds.includes(freeSpaceSongId)) {
    return `${FREE_SPACE_SONG_NAME} is locked to the free space — it can't be picked elsewhere.`;
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
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
  const freeSpaceSongId = await getFreeSpaceSongId();
  const squareError = validateSquares(squares, freeSpaceSongId);
  if (squareError) {
    return NextResponse.json({ error: squareError }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  if (game.type !== "BINGO") {
    return NextResponse.json({ error: "This isn't a Bingo game." }, { status: 400 });
  }
  if (game.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This game isn't open for building cards right now." },
      { status: 400 },
    );
  }

  const entryLockAt = await getEntryLockAt(gameId);
  if (entryLockAt && entryLockAt <= new Date()) {
    return NextResponse.json(
      { error: "Entries closed once the show started — no new cards can be created." },
      { status: 400 },
    );
  }

  const existingCard = await prisma.bingoCard.findUnique({
    where: { gameId_userId: { gameId: game.id, userId: session.sub } },
  });
  if (existingCard) {
    return NextResponse.json({ error: "You already have a card for this game." }, { status: 409 });
  }

  const songIds = squares.map((s) => s.songId);
  const validSongCount = await prisma.song.count({ where: { id: { in: songIds } } });
  if (validSongCount !== songIds.length) {
    return NextResponse.json({ error: "One or more songs weren't recognized." }, { status: 400 });
  }

  const card = await prisma.bingoCard.create({
    data: {
      gameId: game.id,
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
    where: { gameId_userId: { gameId: game.id, userId: session.sub } },
    update: {},
    create: { gameId: game.id, userId: session.sub, amountDue: game.entryFee },
  });

  return NextResponse.json({ card });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
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
  const freeSpaceSongId = await getFreeSpaceSongId();
  const squareError = validateSquares(squares, freeSpaceSongId);
  if (squareError) {
    return NextResponse.json({ error: squareError }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  if (game.status !== "ACTIVE") {
    return NextResponse.json({ error: "This game isn't open for edits right now." }, { status: 400 });
  }

  const existingCard = await prisma.bingoCard.findUnique({
    where: { gameId_userId: { gameId, userId: session.sub } },
  });
  if (!existingCard) {
    return NextResponse.json({ error: "You don't have a card for this game yet." }, { status: 404 });
  }

  const entryLockAt = await getEntryLockAt(gameId);
  if (entryLockAt && entryLockAt <= new Date()) {
    return NextResponse.json(
      { error: "Entries locked once the show started — this card can no longer be edited." },
      { status: 400 },
    );
  }

  const songIds = squares.map((s) => s.songId);
  const validSongCount = await prisma.song.count({ where: { id: { in: songIds } } });
  if (validSongCount !== songIds.length) {
    return NextResponse.json({ error: "One or more songs weren't recognized." }, { status: 400 });
  }

  const card = await prisma.$transaction(async (tx) => {
    await tx.cardSquare.deleteMany({ where: { cardId: existingCard.id, position: { not: FREE_POSITION } } });
    return tx.bingoCard.update({
      where: { id: existingCard.id },
      data: {
        playerName,
        squares: { create: squares.map((s) => ({ position: s.position, songId: s.songId })) },
      },
      include: { squares: true },
    });
  });

  return NextResponse.json({ card });
}
