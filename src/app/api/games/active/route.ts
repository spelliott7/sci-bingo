import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const games = await prisma.game.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true, entries: true } } },
  });

  const withPots = games.map((game) => {
    const playerCount = game.type === "BINGO" ? game._count.cards : game._count.entries;
    return {
      id: game.id,
      type: game.type,
      name: game.name,
      entryFee: game.entryFee,
      pot: playerCount * Number(game.entryFee),
      playerCount,
    };
  });

  return NextResponse.json({ games: withPots });
}
