import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCompletedGamesForUser } from "@/lib/historyQueries";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";

const TYPE_LABEL: Record<string, string> = { BINGO: "Bingo", PICK3: "Pick 3" };

export default async function HistoryPage() {
  const session = await getSession();
  const { games, stats } = await getCompletedGamesForUser(session!.sub);

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">Game History</h1>

        <div className="panel mt-4 flex flex-wrap gap-8">
          <Stat label="Games you've played" value={stats.totalGamesPlayed} />
          <Stat label="Wins" value={stats.totalWins} />
        </div>

        <div className="mt-6 space-y-3">
          {games.length === 0 && (
            <p className="text-white/60">No games have wrapped up yet — check back after one ends.</p>
          )}
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/history/${game.id}`}
              className="panel block hover:border-cheese-gold/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-lg">
                    {game.name}{" "}
                    <span className="align-middle text-xs font-sans text-white/40">
                      {TYPE_LABEL[game.type]}
                    </span>
                  </p>
                  {game.completedAt && (
                    <p className="text-sm text-white/60">
                      Wrapped up {new Date(game.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {game.myResult ? (
                  game.myResult.isWinner ? (
                    <span className="rounded-full bg-cheese-gold/20 px-3 py-1 text-sm font-semibold text-cheese-gold">
                      🏆 You won!
                    </span>
                  ) : game.myResult.wonAt ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">Hit</span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">
                      Played
                    </span>
                  )
                ) : (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/40">
                    Didn&apos;t play
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-3xl text-cheese-gold">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}
