import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";

const TYPE_LABEL: Record<string, string> = { BINGO: "Bingo", PICK3: "Pick 3" };

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
        game,
        hasEntered: Boolean(myCard || myEntry),
        shows: gameShows.map((gs) => gs.show).sort((a, b) => +a.showDate - +b.showDate),
        pot: playerCount * Number(game.entryFee),
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

        {gameDetails.length === 0 && (
          <div className="panel mt-6">
            <p className="text-white/70">
              No games are active right now. Check back once the admin kicks one off, or browse{" "}
              <Link href="/history" className="text-cheese-gold hover:underline">
                past games
              </Link>
              .
            </p>
          </div>
        )}

        {gameDetails.map(({ game, hasEntered, shows, pot }) => (
          <div key={game.id} className="panel mt-6">
            <div className="flex items-center gap-2">
              <p className="text-sm uppercase tracking-wide text-cheese-teal">{TYPE_LABEL[game.type]}</p>
            </div>
            <h2 className="mt-1 font-display text-2xl">{game.name}</h2>
            {shows.length > 0 ? (
              <ul className="mt-2 space-y-0.5 text-sm text-white/50">
                {shows.map((show) => (
                  <li key={show.id}>
                    {show.name ? `${show.name} — ` : ""}
                    {show.venue ? `${show.venue}, ` : ""}
                    {new Date(show.showDate).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-white/50">Shows haven&apos;t been added yet.</p>
            )}
            <p className="mt-2 text-sm">
              Pot so far: <span className="font-semibold text-cheese-gold">${pot.toFixed(2)}</span>
            </p>
            <Link
              href={game.type === "BINGO" ? `/play/${game.id}` : `/pick3/${game.id}`}
              className="btn-primary mt-4 inline-block"
            >
              {hasEntered ? "View your entry" : `Enter — $${Number(game.entryFee).toFixed(2)}`}
            </Link>
          </div>
        ))}
      </main>
    </>
  );
}
