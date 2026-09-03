import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ showId: string; songId: string }> },
) {
  const { showId, songId: songIdParam } = await params;
  const songId = Number(songIdParam);
  if (!Number.isInteger(songId)) {
    return NextResponse.json({ error: "Invalid song." }, { status: 400 });
  }

  await prisma.playedSong
    .delete({ where: { showId_songId: { showId, songId } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
