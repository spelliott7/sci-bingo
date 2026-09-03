import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getPlayedSongsForGame, getShowsForGame } from "@/lib/gameQueries";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const [entry, playedSongs, game, shows] = await Promise.all([
    prisma.pick3Entry.findUnique({
      where: { gameId_userId: { gameId, userId: session.sub } },
      include: { picks: { include: { song: true } } },
    }),
    getPlayedSongsForGame(gameId),
    prisma.game.findUnique({ where: { id: gameId } }),
    getShowsForGame(gameId),
  ]);

  return NextResponse.json({ entry, playedSongs, game, shows });
}
