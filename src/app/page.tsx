import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import DashboardGames from "@/components/DashboardGames";

export default async function DashboardPage() {
  const session = await getSession();

  const activeGames = await prisma.game.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true, entries: true } } },
  });

  const gameDetails = await Promise.all(
    activeGames.map(async (game) => {
      const [myCard, myEntry, gameShows] = await Promise.all([
        game.type === "BINGO"
          ? prisma.bingoCard.findUnique({
              where: { gameId_userId: { gameId: game.id, userId: session!.sub } },
            })
          : null,
        game.type === "PICK3"
          ? prisma.pick3Entry.findUnique({
              where: { gameId_userId: { gameId: game.id, userId: session!.sub } },
            })
          : null,
        prisma.gameShow.findMany({ where: { gameId: game.id }, include: { show: true } }),
      ]);
      const playerCount = game.type === "BINGO" ? game._count.cards : game._count.entries;
      return {
        id: game.id,
        type: game.type,
        name: game.name,
        entryFee: Number(game.entryFee),
        pot: playerCount * Number(game.entryFee),
        playerCount,
        hasEntered: Boolean(myCard || myEntry),
        shows: gameShows
          .map((gs) => ({
            id: gs.show.id,
            name: gs.show.name,
            venue: gs.show.venue,
            showDate: gs.show.showDate.toISOString(),
          }))
          .sort((a, b) => +new Date(a.showDate) - +new Date(b.showDate)),
      };
    }),
  );

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="title-gradient font-display text-3xl sm:text-4xl">
          Hey {session?.username} 👋
        </h1>

        <DashboardGames initialGames={gameDetails} />
      </main>
    </>
  );
}
