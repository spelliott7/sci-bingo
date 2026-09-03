import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeFirstBingo } from "@/lib/bingo";
import { computePick3Win } from "@/lib/pick3";
import { getPlayedSongsForGame } from "@/lib/gameQueries";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  const [payments, playedSongs] = await Promise.all([
    prisma.payment.findMany({ where: { gameId } }),
    getPlayedSongsForGame(gameId),
  ]);
  const paymentByUserId = new Map(payments.map((p) => [p.userId, p]));

  let players: {
    userId: string;
    username: string;
    email: string;
    playerName: string;
    entryId: string;
    paid: boolean;
    paidAt: Date | null;
    amountDue: number;
    wonAt: string | null;
  }[];

  if (game.type === "BINGO") {
    const cards = await prisma.bingoCard.findMany({
      where: { gameId },
      include: { user: { select: { id: true, username: true, email: true } }, squares: true },
      orderBy: { createdAt: "asc" },
    });
    players = cards.map((card) => {
      const payment = paymentByUserId.get(card.userId);
      const bingo = computeFirstBingo(card.squares, playedSongs);
      return {
        userId: card.userId,
        username: card.user.username,
        email: card.user.email,
        playerName: card.playerName,
        entryId: card.id,
        paid: payment?.paid ?? false,
        paidAt: payment?.paidAt ?? null,
        amountDue: payment ? Number(payment.amountDue) : 0,
        wonAt: bingo ? bingo.playedAt.toISOString() : null,
      };
    });
  } else {
    const entries = await prisma.pick3Entry.findMany({
      where: { gameId },
      include: { user: { select: { id: true, username: true, email: true } }, picks: true },
      orderBy: { createdAt: "asc" },
    });
    players = entries.map((entry) => {
      const payment = paymentByUserId.get(entry.userId);
      const won = computePick3Win(entry.picks, playedSongs);
      return {
        userId: entry.userId,
        username: entry.user.username,
        email: entry.user.email,
        playerName: entry.playerName,
        entryId: entry.id,
        paid: payment?.paid ?? false,
        paidAt: payment?.paidAt ?? null,
        amountDue: payment ? Number(payment.amountDue) : 0,
        wonAt: won ? won.toISOString() : null,
      };
    });
  }

  const totalPlayers = players.length;
  const paidCount = players.filter((p) => p.paid).length;
  const pot = totalPlayers * Number(game.entryFee);
  const collected = players.filter((p) => p.paid).reduce((sum, p) => sum + p.amountDue, 0);

  return NextResponse.json({
    players,
    summary: {
      totalPlayers,
      paidCount,
      unpaidCount: totalPlayers - paidCount,
      pot,
      collected,
      outstanding: pot - collected,
    },
  });
}
