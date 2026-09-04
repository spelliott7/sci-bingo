import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PICK3_COUNT } from "@/lib/pick3";
import { getEntryLockAt } from "@/lib/gameQueries";

const schema = z.object({
  playerName: z.string().trim().min(1, "Enter a name for this entry.").max(60),
  songIds: z.array(z.number().int()).length(PICK3_COUNT, "Pick exactly 3 songs."),
});

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
      { error: parsed.error.issues[0]?.message ?? "Invalid entry." },
      { status: 400 },
    );
  }

  const { playerName, songIds } = parsed.data;
  if (new Set(songIds).size !== songIds.length) {
    return NextResponse.json({ error: "Pick 3 different songs." }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  if (game.type !== "PICK3") {
    return NextResponse.json({ error: "This isn't a Pick 3 game." }, { status: 400 });
  }
  if (game.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This game isn't open for entries right now." },
      { status: 400 },
    );
  }

  const entryLockAt = await getEntryLockAt(gameId);
  if (entryLockAt && entryLockAt <= new Date()) {
    return NextResponse.json(
      { error: "Entries closed once the show started — no new entries can be created." },
      { status: 400 },
    );
  }

  const existingEntry = await prisma.pick3Entry.findUnique({
    where: { gameId_userId: { gameId: game.id, userId: session.sub } },
  });
  if (existingEntry) {
    return NextResponse.json({ error: "You already have an entry for this game." }, { status: 409 });
  }

  const validSongCount = await prisma.song.count({ where: { id: { in: songIds } } });
  if (validSongCount !== songIds.length) {
    return NextResponse.json({ error: "One or more songs weren't recognized." }, { status: 400 });
  }

  const entry = await prisma.pick3Entry.create({
    data: {
      gameId: game.id,
      userId: session.sub,
      playerName,
      picks: { create: songIds.map((songId) => ({ songId })) },
    },
    include: { picks: true },
  });

  await prisma.payment.upsert({
    where: { gameId_userId: { gameId: game.id, userId: session.sub } },
    update: {},
    create: { gameId: game.id, userId: session.sub, amountDue: game.entryFee },
  });

  return NextResponse.json({ entry });
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
      { error: parsed.error.issues[0]?.message ?? "Invalid entry." },
      { status: 400 },
    );
  }

  const { playerName, songIds } = parsed.data;
  if (new Set(songIds).size !== songIds.length) {
    return NextResponse.json({ error: "Pick 3 different songs." }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  if (game.status !== "ACTIVE") {
    return NextResponse.json({ error: "This game isn't open for edits right now." }, { status: 400 });
  }

  const existingEntry = await prisma.pick3Entry.findUnique({
    where: { gameId_userId: { gameId, userId: session.sub } },
  });
  if (!existingEntry) {
    return NextResponse.json({ error: "You don't have an entry for this game yet." }, { status: 404 });
  }

  const entryLockAt = await getEntryLockAt(gameId);
  if (entryLockAt && entryLockAt <= new Date()) {
    return NextResponse.json(
      { error: "Entries locked once the show started — this entry can no longer be edited." },
      { status: 400 },
    );
  }

  const validSongCount = await prisma.song.count({ where: { id: { in: songIds } } });
  if (validSongCount !== songIds.length) {
    return NextResponse.json({ error: "One or more songs weren't recognized." }, { status: 400 });
  }

  const entry = await prisma.$transaction(async (tx) => {
    await tx.pick3Pick.deleteMany({ where: { entryId: existingEntry.id } });
    return tx.pick3Entry.update({
      where: { id: existingEntry.id },
      data: {
        playerName,
        picks: { create: songIds.map((songId) => ({ songId })) },
      },
      include: { picks: true },
    });
  });

  return NextResponse.json({ entry });
}
