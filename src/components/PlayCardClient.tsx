"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BingoGrid, { type GridSquare } from "@/components/BingoGrid";
import type { SongOption } from "@/components/SongTypeahead";
import VenmoPaymentPrompt from "@/components/VenmoPaymentPrompt";
import { FREE_POSITION, computeFirstBingo, getCompletedLines, getMarkedPositions } from "@/lib/bingo";

type CardResponse = {
  card: {
    id: string;
    playerName: string;
    squares: { position: number; songId: number | null; song: { name: string } | null }[];
  } | null;
  playedSongs: { songId: number; playedAt: string }[];
  game: {
    id: string;
    name: string;
    status: string;
    entryFee: string | number;
    venmoHandle: string | null;
    winnerCardId: string | null;
  } | null;
  shows: { id: string; name: string | null; venue: string | null; showDate: string }[];
  payment: { paid: boolean; amountDue: number } | null;
};

const EMPTY_POSITIONS = Array.from({ length: 25 }, (_, i) => i).filter((p) => p !== FREE_POSITION);

export default function PlayCardClient({
  gameId,
  defaultPlayerName,
}: {
  gameId: string;
  defaultPlayerName: string;
}) {
  const [songs, setSongs] = useState<SongOption[] | null>(null);
  const [data, setData] = useState<CardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Builder state
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [builderSquares, setBuilderSquares] = useState<GridSquare[]>(() =>
    EMPTY_POSITIONS.map((position) => ({ position, songId: null })),
  );
  const [submitting, setSubmitting] = useState(false);
  const [builderLayout, setBuilderLayout] = useState<"grid" | "list">("list");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCard = useCallback(async () => {
    const res = await fetch(`/api/games/${gameId}/cards/me`);
    if (res.ok) {
      const json: CardResponse = await res.json();
      setData(json);
    }
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const [songsRes] = await Promise.all([fetch("/api/songs"), loadCard()]);
      if (cancelled) return;
      if (songsRes.ok) {
        const json = await songsRes.json();
        setSongs(json.songs);
      }
      setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [loadCard]);

  useEffect(() => {
    if (!data?.card || data.game?.status === "COMPLETED") return;
    pollRef.current = setInterval(loadCard, 7000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data?.card, data?.game?.status, loadCard]);

  const playedSongIds = useMemo(
    () => new Set((data?.playedSongs ?? []).map((p) => p.songId)),
    [data?.playedSongs],
  );

  const viewSquares: GridSquare[] = useMemo(() => {
    if (!data?.card) return [];
    return data.card.squares.map((s) => ({
      position: s.position,
      songId: s.songId,
      songName: s.song?.name,
    }));
  }, [data]);

  const markedPositions = useMemo(
    () => getMarkedPositions(viewSquares, playedSongIds),
    [viewSquares, playedSongIds],
  );

  const completedLines = useMemo(() => getCompletedLines(markedPositions), [markedPositions]);
  const winningPositions = useMemo(
    () => new Set(completedLines.flat()),
    [completedLines],
  );

  const bingoResult = useMemo(() => {
    if (!data?.card || !data.playedSongs) return null;
    return computeFirstBingo(
      viewSquares,
      data.playedSongs.map((p) => ({ songId: p.songId, playedAt: new Date(p.playedAt) })),
    );
  }, [data, viewSquares]);

  async function handleSubmit() {
    setError(null);
    const incomplete = builderSquares.some((s) => s.songId === null);
    if (incomplete) {
      setError("Every square needs a song before you can save your card.");
      return;
    }
    if (!playerName.trim()) {
      setError("Enter a name so we know it's your card.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${gameId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          squares: builderSquares.map((s) => ({ position: s.position, songId: s.songId })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't save your card.");
        return;
      }
      await loadCard();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-white/70">Loading…</p>;
  }

  if (!data?.game) {
    return <p className="text-white/70">This game doesn&apos;t exist.</p>;
  }

  if (data.game.status !== "ACTIVE" && !data.card) {
    return (
      <p className="text-white/70">
        This game isn&apos;t open for building cards right now — check back once the admin
        activates it.
      </p>
    );
  }

  if (data.card) {
    const hasBingo = completedLines.length > 0;
    const isDeclaredWinner = data.game.winnerCardId === data.card.id;
    return (
      <div>
        {isDeclaredWinner && (
          <div className="mb-4 rounded-xl border border-cheese-gold bg-cheese-gold/20 p-4 text-center">
            <p className="font-display text-2xl text-cheese-gold">You won! 🎉</p>
          </div>
        )}
        {!isDeclaredWinner && hasBingo && (
          <div className="mb-4 rounded-xl border border-cheese-gold bg-cheese-gold/20 p-4 text-center">
            <p className="font-display text-2xl text-cheese-gold">BINGO!</p>
            {bingoResult && (
              <p className="text-sm text-white/70">
                Called it at {new Date(bingoResult.playedAt).toLocaleTimeString()}
                {data.game.status !== "COMPLETED" &&
                  " — the admin will confirm the winner once the game wraps up."}
              </p>
            )}
          </div>
        )}
        <p className="mb-3 text-sm text-white/60">
          Playing as <span className="font-semibold text-white">{data.card.playerName}</span> in{" "}
          <span className="font-semibold text-white">{data.game.name}</span>
          {data.game.status !== "COMPLETED" &&
            " — card updates automatically as songs get marked played across every show in this game."}
        </p>
        {data.shows.length > 0 && (
          <p className="mb-4 text-xs text-white/40">
            Shows: {data.shows.map((s) => new Date(s.showDate).toLocaleDateString()).join(", ")}
          </p>
        )}
        <BingoGrid mode="view" squares={viewSquares} markedPositions={markedPositions} winningPositions={winningPositions} />

        {data.game.venmoHandle && data.payment && (
          <div className="mt-6">
            {data.payment.paid ? (
              <p className="text-center text-sm text-cheese-teal">✓ You&apos;re paid up for this game.</p>
            ) : (
              <VenmoPaymentPrompt
                venmoHandle={data.game.venmoHandle}
                amount={data.payment.amountDue}
                note={data.game.name}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  if (!songs) {
    return <p className="text-white/70">Loading songs…</p>;
  }

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <label className="label" htmlFor="playerName">
          Name on this card
        </label>
        <input
          id="playerName"
          className="field"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={60}
        />
      </div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">
          Pick a different song for every square — no repeats. The center is free. This card
          covers the whole game, so it stays live across every show until the admin wraps it up.
        </p>
        <div className="flex shrink-0 rounded-full border border-white/20 bg-white/5 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setBuilderLayout("list")}
            className={`rounded-full px-3 py-1 transition ${
              builderLayout === "list" ? "bg-cheese-gold text-cheese-ink" : "text-white/60"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setBuilderLayout("grid")}
            className={`rounded-full px-3 py-1 transition ${
              builderLayout === "grid" ? "bg-cheese-gold text-cheese-ink" : "text-white/60"
            }`}
          >
            Grid
          </button>
        </div>
      </div>
      <BingoGrid
        mode="build"
        layout={builderLayout}
        songs={songs}
        squares={builderSquares}
        onChangeSquare={(position, songId) =>
          setBuilderSquares((prev) =>
            prev.map((s) => (s.position === position ? { ...s, songId } : s)),
          )
        }
      />
      {error && <p className="mt-3 text-sm text-cheese-pink">{error}</p>}
      <button onClick={handleSubmit} disabled={submitting} className="btn-primary mt-4">
        {submitting
          ? "Saving…"
          : `Save my card ($${Number(data.game.entryFee).toFixed(2)} to play)`}
      </button>
    </div>
  );
}
