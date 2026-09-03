import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import GameStatusControls from "@/components/GameStatusControls";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-white/10 text-white/60",
  ACTIVE: "bg-cheese-teal/30 text-cheese-teal",
  COMPLETED: "bg-cheese-gold/20 text-cheese-gold",
};

const TYPE_LABEL: Record<string, string> = {
  BINGO: "Bingo",
  PICK3: "Pick 3",
};

export default async function AdminHomePage() {
  const session = await getSession();
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true, entries: true, shows: true } } },
  });

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">Admin</h1>
          <Link href="/admin/games/new" className="btn-primary">
            + New game
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {games.length === 0 && (
            <p className="text-white/60">No games yet — create one to get started.</p>
          )}
          {games.map((game) => {
            const playerCount = game.type === "BINGO" ? game._count.cards : game._count.entries;
            return (
              <div key={game.id} className="panel flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/games/${game.id}`} className="font-display text-lg hover:text-cheese-gold">
                      {game.name}
                    </Link>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
                      {TYPE_LABEL[game.type]}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[game.status]}`}>
                      {game.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">
                    {game._count.shows} show{game._count.shows === 1 ? "" : "s"} · {playerCount} player
                    {playerCount === 1 ? "" : "s"} · pot ${(playerCount * Number(game.entryFee)).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/games/${game.id}`} className="btn-secondary text-xs">
                    Manage
                  </Link>
                  <GameStatusControls gameId={game.id} status={game.status} />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
