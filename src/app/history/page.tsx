import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCompletedRunsForUser } from "@/lib/historyQueries";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";

export default async function HistoryPage() {
  const session = await getSession();
  const { runs, stats } = await getCompletedRunsForUser(session!.sub);

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">Run History</h1>

        <div className="panel mt-4 flex flex-wrap gap-8">
          <Stat label="Runs you've played" value={stats.totalRunsPlayed} />
          <Stat label="Wins" value={stats.totalWins} />
        </div>

        <div className="mt-6 space-y-3">
          {runs.length === 0 && (
            <p className="text-white/60">No runs have wrapped up yet — check back after one ends.</p>
          )}
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/history/${run.id}`}
              className="panel block hover:border-cheese-gold/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{run.name}</p>
                  {run.completedAt && (
                    <p className="text-sm text-white/60">
                      Wrapped up {new Date(run.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {run.myCard ? (
                  run.myCard.isWinner ? (
                    <span className="rounded-full bg-cheese-gold/20 px-3 py-1 text-sm font-semibold text-cheese-gold">
                      🏆 You won!
                    </span>
                  ) : run.myCard.wonBingoAt ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">
                      Got bingo
                    </span>
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
