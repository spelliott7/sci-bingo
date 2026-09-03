import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const [card, playedSongs, run, shows] = await Promise.all([
    prisma.bingoCard.findUnique({
      where: { runId_userId: { runId, userId: session.sub } },
      include: { squares: { include: { song: true }, orderBy: { position: "asc" } } },
    }),
    prisma.playedSong.findMany({
      where: { show: { runId } },
      include: { song: true },
      orderBy: { playedAt: "asc" },
    }),
    prisma.run.findUnique({ where: { id: runId } }),
    prisma.show.findMany({ where: { runId }, orderBy: { showDate: "asc" } }),
  ]);

  return NextResponse.json({ card, playedSongs, run, shows });
}
