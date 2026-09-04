import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  const games = await prisma.game.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true, entries: true } } },
  });

  const withDetails = await Promise.all(
    games.map(async (game) => {
      const playerCount = game.type === "BINGO" ? game._count.cards : game._count.entries;

      const [gameShows, hasEntered] = await Promise.all([
        prisma.gameShow.findMany({ where: { gameId: game.id }, include: { show: true } }),
        session
          ? game.type === "BINGO"
            ? prisma.bingoCard
                .findUnique({ where: { gameId_userId: { gameId: game.id, userId: session.sub } } })
                .then(Boolean)
            : prisma.pick3Entry
                .findUnique({ where: { gameId_userId: { gameId: game.id, userId: session.sub } } })
                .then(Boolean)
          : Promise.resolve(false),
      ]);

      return {
        id: game.id,
        type: game.type,
        name: game.name,
        entryFee: Number(game.entryFee),
        pot: playerCount * Number(game.entryFee),
        playerCount,
        hasEntered,
        shows: gameShows
          .map((gs) => ({
            id: gs.show.id,
            name: gs.show.name,
            venue: gs.show.venue,
            showDate: gs.show.showDate,
          }))
          .sort((a, b) => +new Date(a.showDate) - +new Date(b.showDate)),
      };
    }),
  );

  return NextResponse.json({ games: withDetails });
}
