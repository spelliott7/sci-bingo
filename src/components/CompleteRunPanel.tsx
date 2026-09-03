"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Player = {
  userId: string;
  username: string;
  playerName: string;
  cardId: string;
  wonBingoAt: string | null;
};

export default function CompleteRunPanel({ runId }: { runId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [winnerCardId, setWinnerCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const suggestedWinner = useMemo(() => {
    if (!players) return null;
    const withBingo = players.filter((p) => p.wonBingoAt);
    if (withBingo.length === 0) return null;
    return withBingo.sort((a, b) => a.wonBingoAt!.localeCompare(b.wonBingoAt!))[0];
  }, [players]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/admin/runs/${runId}/players`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setPlayers(json.players);
      });
    return () => {
      cancelled = true;
    };
  }, [open, runId]);

  // Default the selection to the suggested winner the first time it becomes known,
  // without stomping on a choice the admin already made — adjust during render
  // instead of in an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  const [appliedSuggestedId, setAppliedSuggestedId] = useState<string | null>(null);
  if (suggestedWinner && suggestedWinner.cardId !== appliedSuggestedId) {
    setAppliedSuggestedId(suggestedWinner.cardId);
    setWinnerCardId(suggestedWinner.cardId);
  }

  async function handleComplete() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", winnerCardId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't complete the run.");
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
        Complete run…
      </button>
    );
  }

  return (
    <div className="panel mt-4 border-cheese-gold/40">
      <h3 className="font-display text-lg text-cheese-gold">Wrap up this run</h3>
      <p className="mt-1 text-sm text-white/60">
        Pick the winner before completing — once completed, players will see the final result and
        cards stop updating.
      </p>

      {!players ? (
        <p className="mt-3 text-sm text-white/50">Loading players…</p>
      ) : players.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">No cards were built for this run.</p>
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
                  checked={winnerCardId === p.cardId}
                  onChange={() => setWinnerCardId(p.cardId)}
                />
                <span className="font-semibold">{p.playerName}</span>
                <span className="text-white/50">@{p.username}</span>
              </span>
              {p.wonBingoAt ? (
                <span className="text-xs text-cheese-gold">
                  BINGO {new Date(p.wonBingoAt).toLocaleString()}
                </span>
              ) : (
                <span className="text-xs text-white/40">no bingo yet</span>
              )}
            </label>
          ))}
          <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
            <input
              type="radio"
              name="winner"
              checked={winnerCardId === null}
              onChange={() => setWinnerCardId(null)}
            />
            No winner
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-cheese-pink">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button className="btn-primary" disabled={submitting} onClick={handleComplete}>
          {submitting ? "Completing…" : "Confirm & complete run"}
        </button>
        <button className="btn-secondary" disabled={submitting} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
