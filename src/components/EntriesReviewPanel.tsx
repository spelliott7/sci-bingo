"use client";

import { useCallback, useEffect, useState } from "react";
import BingoGrid from "@/components/BingoGrid";
import { getCompletedLines, getMarkedPositions } from "@/lib/bingo";

type Show = {
  id: string;
  showDate: string;
  playedSongs: { songId: number; songName: string; playedAt: string }[];
};

type BingoResult = {
  entryId: string;
  playerName: string;
  username: string;
  isWinner: boolean;
  wonAt: string | null;
  markedCount: number;
  squares: { position: number; songId: number | null; songName: string | null }[];
};

type Pick3Result = {
  entryId: string;
  playerName: string;
  username: string;
  isWinner: boolean;
  wonAt: string | null;
  markedCount: number;
  picks: { songId: number; songName: string }[];
};

type EntriesResponse = {
  game: { type: "BINGO" | "PICK3"; status: string };
  shows: Show[];
  results: (BingoResult | Pick3Result)[];
};

export default function EntriesReviewPanel({ gameId }: { gameId: string }) {
  const [data, setData] = useState<EntriesResponse | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/games/${gameId}/entries`);
    if (res.ok) {
      setData(await res.json());
    }
  }, [gameId]);

  useEffect(() => {
    // Intentional: fetch immediately, then poll so marks made elsewhere show up live.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) {
    return <p className="text-white/50">Loading entries…</p>;
  }

  const { game, shows, results } = data;
  const playedSongIds = new Set(shows.flatMap((s) => s.playedSongs.map((p) => p.songId)));

  if (results.length === 0) {
    return <p className="text-white/50">No one has entered this game yet.</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex gap-4">
        {results.map((r) => (
          <div
            key={r.entryId}
            className={`w-[300px] shrink-0 rounded-xl border p-3 shadow-xl ${
              r.isWinner
                ? "border-cheese-gold bg-[#150a28]/95"
                : "border-white/15 bg-[#150a28]/95"
            }`}
          >
            <div className="mb-2">
              <p className="flex items-center gap-1.5 font-semibold">
                {r.isWinner && <span>🏆</span>}
                {r.playerName}
              </p>
              <p className="text-xs text-white/50">@{r.username}</p>
              <p className="mt-1 text-xs text-white/60">
                {r.isWinner
                  ? "Winner"
                  : r.wonAt
                    ? `${game.type === "BINGO" ? "BINGO" : "HIT"} at ${new Date(r.wonAt).toLocaleTimeString()}`
                    : game.type === "BINGO"
                      ? `${r.markedCount}/25 marked`
                      : `${r.markedCount}/3 hit`}
              </p>
            </div>

            {game.type === "BINGO" && "squares" in r ? (
              <BingoEntryGrid squares={r.squares} playedSongIds={playedSongIds} />
            ) : "picks" in r ? (
              <div className="space-y-1.5">
                {r.picks.map((pick) => {
                  const hit = playedSongIds.has(pick.songId);
                  return (
                    <div
                      key={pick.songId}
                      className={`rounded-lg border px-2 py-1.5 text-center text-sm font-semibold ${
                        hit
                          ? "border-cheese-gold bg-cheese-gold/80 text-cheese-ink"
                          : "border-white/15 bg-[#150a28]/90 text-white/80"
                      }`}
                    >
                      {pick.songName}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function BingoEntryGrid({
  squares,
  playedSongIds,
}: {
  squares: BingoResult["squares"];
  playedSongIds: ReadonlySet<number>;
}) {
  const gridSquares = squares.map((s) => ({
    position: s.position,
    songId: s.songId,
    songName: s.songName,
  }));
  const marked = getMarkedPositions(gridSquares, playedSongIds);
  const winningPositions = new Set(getCompletedLines(marked).flat());

  return (
    <BingoGrid
      mode="view"
      squares={gridSquares}
      markedPositions={marked}
      winningPositions={winningPositions}
    />
  );
}
