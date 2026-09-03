import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRunHistoryDetail } from "@/lib/historyQueries";
import { getCompletedLines, getMarkedPositions } from "@/lib/bingo";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import BingoGrid from "@/components/BingoGrid";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const session = await getSession();
  const data = await getRunHistoryDetail(runId, session!.sub);
  if (!data) notFound();

  const { run, shows, results } = data;
  const playedSongIds = new Set(shows.flatMap((s) => s.playedSongs.map((p) => p.songId)));
  const myResult = results.find((r) => r.isMe);
  const myMarked = myResult ? getMarkedPositions(myResult.squares, playedSongIds) : new Set<number>();
  const myWinningPositions = new Set(getCompletedLines(myMarked).flat());

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">{run.name}</h1>
        {run.completedAt && (
          <p className="text-white/60">Wrapped up {new Date(run.completedAt).toLocaleDateString()}</p>
        )}

        <div className="panel mt-6">
          <h2 className="font-display text-lg text-cheese-teal">Results</h2>
          <ol className="mt-3 space-y-2">
            {results.map((r) => (
              <li
                key={r.cardId}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  r.isWinner ? "bg-cheese-gold/15" : r.isMe ? "bg-white/10" : "bg-white/5"
                }`}
              >
                <span>
                  {r.isWinner && <span className="mr-1">🏆</span>}
                  <span className="font-semibold">{r.playerName}</span>
                  <span className="ml-2 text-sm text-white/50">@{r.username}</span>
                  {r.isMe && <span className="ml-2 text-xs text-cheese-gold">(you)</span>}
                </span>
                {r.isWinner ? (
                  <span className="text-sm font-semibold text-cheese-gold">Winner</span>
                ) : r.wonBingoAt ? (
                  <span className="text-sm text-white/60">
                    BINGO — {new Date(r.wonBingoAt).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sm text-white/50">{r.markedCount}/25 marked</span>
                )}
              </li>
            ))}
            {results.length === 0 && <p className="text-white/60">No cards were played.</p>}
          </ol>
        </div>

        {myResult && (
          <div className="panel mt-6">
            <h2 className="font-display text-lg text-cheese-teal">Your card</h2>
            <div className="mt-3">
              <BingoGrid
                mode="view"
                squares={myResult.squares}
                markedPositions={myMarked}
                winningPositions={myWinningPositions}
              />
            </div>
          </div>
        )}

        <div className="panel mt-6">
          <h2 className="font-display text-lg text-cheese-teal">Shows</h2>
          <div className="mt-3 space-y-4">
            {shows.map((show) => (
              <div key={show.id}>
                <p className="font-semibold">
                  {show.name ? `${show.name} — ` : ""}
                  {show.venue ? `${show.venue}, ` : ""}
                  {new Date(show.showDate).toLocaleDateString()}
                </p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-white/70">
                  {show.playedSongs.map((p) => (
                    <li key={p.songId}>{p.songName}</li>
                  ))}
                  {show.playedSongs.length === 0 && (
                    <p className="text-white/50">No songs were logged.</p>
                  )}
                </ol>
              </div>
            ))}
            {shows.length === 0 && <p className="text-white/50">No shows were added to this run.</p>}
          </div>
        </div>
      </main>
    </>
  );
}
