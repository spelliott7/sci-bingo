import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const playedSongs = await prisma.playedSong.findMany({
    where: { showId },
    include: { song: true },
    orderBy: { playedAt: "asc" },
  });
  return NextResponse.json({ playedSongs });
}

const schema = z.object({ songId: z.number().int() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ showId: string }> },
) {
  const { showId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a song." }, { status: 400 });
  }

  const show = await prisma.show.findUnique({ where: { id: showId } });
  if (!show) {
    return NextResponse.json({ error: "Show not found." }, { status: 404 });
  }

  const song = await prisma.song.findUnique({ where: { id: parsed.data.songId } });
  if (!song) {
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  }

  const already = await prisma.playedSong.findUnique({
    where: { showId_songId: { showId: show.id, songId: song.id } },
  });
  if (already) {
    return NextResponse.json({ error: `"${song.name}" is already marked played.` }, { status: 409 });
  }

  const playedSong = await prisma.playedSong.create({
    data: { showId: show.id, songId: song.id },
    include: { song: true },
  });

  return NextResponse.json({ playedSong });
}
