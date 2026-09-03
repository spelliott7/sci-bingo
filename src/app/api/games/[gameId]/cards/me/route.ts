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

  const [card, playedSongs, game, shows, payment] = await Promise.all([
    prisma.bingoCard.findUnique({
      where: { gameId_userId: { gameId, userId: session.sub } },
      include: { squares: { include: { song: true }, orderBy: { position: "asc" } } },
    }),
    getPlayedSongsForGame(gameId),
    prisma.game.findUnique({ where: { id: gameId } }),
    getShowsForGame(gameId),
    prisma.payment.findUnique({ where: { gameId_userId: { gameId, userId: session.sub } } }),
  ]);

  return NextResponse.json({
    card,
    playedSongs,
    game,
    shows,
    payment: payment ? { paid: payment.paid, amountDue: Number(payment.amountDue) } : null,
  });
}
