import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeFirstBingo } from "@/lib/bingo";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const [cards, payments, playedSongs] = await Promise.all([
    prisma.bingoCard.findMany({
      where: { runId },
      include: {
        user: { select: { id: true, username: true, email: true } },
        squares: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.findMany({ where: { runId } }),
    prisma.playedSong.findMany({ where: { show: { runId } } }),
  ]);

  const paymentByUserId = new Map(payments.map((p) => [p.userId, p]));

  const players = cards.map((card) => {
    const payment = paymentByUserId.get(card.userId);
    const bingo = computeFirstBingo(card.squares, playedSongs);
    return {
      userId: card.userId,
      username: card.user.username,
      email: card.user.email,
      playerName: card.playerName,
      cardId: card.id,
      paid: payment?.paid ?? false,
      paidAt: payment?.paidAt ?? null,
      amountDue: payment ? Number(payment.amountDue) : 0,
      wonBingoAt: bingo ? bingo.playedAt.toISOString() : null,
    };
  });

  const totalPlayers = players.length;
  const paidCount = players.filter((p) => p.paid).length;
  const expected = players.reduce((sum, p) => sum + p.amountDue, 0);
  const collected = players.filter((p) => p.paid).reduce((sum, p) => sum + p.amountDue, 0);

  return NextResponse.json({
    players,
    summary: {
      totalPlayers,
      paidCount,
      unpaidCount: totalPlayers - paidCount,
      expected,
      collected,
      outstanding: expected - collected,
    },
  });
}
