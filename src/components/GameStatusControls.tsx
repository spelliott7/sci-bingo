"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "DRAFT" | "ACTIVE" | "COMPLETED";

/** Handles the one simple transition (DRAFT -> ACTIVE). Completing a game
 * requires picking a winner, so that lives in CompleteGamePanel instead. */
export default function GameStatusControls({ gameId, status }: { gameId: string; status: Status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't activate the game.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status !== "DRAFT") return error ? <span className="text-xs text-cheese-pink">{error}</span> : null;

  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary text-xs" disabled={loading} onClick={activate}>
        Activate
      </button>
      {error && <span className="text-xs text-cheese-pink">{error}</span>}
    </div>
  );
}
