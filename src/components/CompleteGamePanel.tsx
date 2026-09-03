"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Player = {
  userId: string;
  username: string;
  playerName: string;
  entryId: string;
  wonAt: string | null;
};

export default function CompleteGamePanel({
  gameId,
  type,
}: {
  gameId: string;
  type: "BINGO" | "PICK3";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [winnerEntryId, setWinnerEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const suggestedWinner = useMemo(() => {
    if (!players) return null;
    const withWin = players.filter((p) => p.wonAt);
    if (withWin.length === 0) return null;
    return withWin.sort((a, b) => a.wonAt!.localeCompare(b.wonAt!))[0];
  }, [players]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/admin/games/${gameId}/players`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setPlayers(json.players);
      });
    return () => {
      cancelled = true;
    };
  }, [open, gameId]);

  // Default the selection to the suggested winner the first time it becomes known,
  // without stomping on a choice the admin already made — adjust during render
  // instead of in an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  const [appliedSuggestedId, setAppliedSuggestedId] = useState<string | null>(null);
  if (suggestedWinner && suggestedWinner.entryId !== appliedSuggestedId) {
    setAppliedSuggestedId(suggestedWinner.entryId);
    setWinnerEntryId(suggestedWinner.entryId);
  }

  async function handleComplete() {
    setError(null);
    setSubmitting(true);
    try {
      const winnerKey = type === "BINGO" ? "winnerCardId" : "winnerEntryId";
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", [winnerKey]: winnerEntryId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't complete the game.");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-secondary text-xs" onClick={() => setOpen(true)}>
        Complete game…
      </button>
    );
  }

  return (
    <div className="panel mt-4 border-cheese-gold/40">
      <h3 className="font-display text-lg text-cheese-gold">Wrap up this game</h3>
      <p className="mt-1 text-sm text-white/60">
        Pick the winner before completing — once completed, players will see the final result and
        entries stop updating.
      </p>

      {!players ? (
        <p className="mt-3 text-sm text-white/50">Loading players…</p>
      ) : players.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">No one entered this game.</p>
      ) : (
        <div className="mt-3 space-y-1">
          {players.map((p) => (
            <label
              key={p.userId}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="winner"
                  checked={winnerEntryId === p.entryId}
                  onChange={() => setWinnerEntryId(p.entryId)}
                />
                <span className="font-semibold">{p.playerName}</span>
                <span className="text-white/50">@{p.username}</span>
              </span>
              {p.wonAt ? (
                <span className="text-xs text-cheese-gold">
                  {type === "BINGO" ? "BINGO" : "HIT"} {new Date(p.wonAt).toLocaleString()}
                </span>
              ) : (
                <span className="text-xs text-white/40">not yet</span>
              )}
            </label>
          ))}
          <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
            <input
              type="radio"
              name="winner"
              checked={winnerEntryId === null}
              onChange={() => setWinnerEntryId(null)}
            />
            No winner
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-cheese-pink">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button className="btn-primary" disabled={submitting} onClick={handleComplete}>
          {submitting ? "Completing…" : "Confirm & complete game"}
        </button>
        <button className="btn-secondary" disabled={submitting} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
