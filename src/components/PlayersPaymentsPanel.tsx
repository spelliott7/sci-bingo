"use client";

import { useCallback, useEffect, useState } from "react";

type Player = {
  userId: string;
  username: string;
  playerName: string;
  paid: boolean;
  paidAt: string | null;
  amountDue: number;
};

type Summary = {
  totalPlayers: number;
  paidCount: number;
  unpaidCount: number;
  expected: number;
  collected: number;
  outstanding: number;
};

export default function PlayersPaymentsPanel({ runId }: { runId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/runs/${runId}/players`);
    if (res.ok) {
      const json = await res.json();
      setPlayers(json.players);
      setSummary(json.summary);
    }
  }, [runId]);

  useEffect(() => {
    // Intentional: fetch immediately on mount, then poll for live payment updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  async function togglePaid(player: Player) {
    setBusyUserId(player.userId);
    try {
      await fetch(`/api/admin/runs/${runId}/payments/${player.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !player.paid }),
      });
      await load();
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div>
      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile label="Players" value={summary.totalPlayers} />
          <SummaryTile label="Paid" value={`${summary.paidCount}/${summary.totalPlayers}`} />
          <SummaryTile label="Collected" value={`$${summary.collected.toFixed(2)}`} highlight />
          <SummaryTile label="Outstanding" value={`$${summary.outstanding.toFixed(2)}`} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-white/50">
            <tr>
              <th className="py-1 pr-2 font-normal">Player</th>
              <th className="py-1 pr-2 font-normal">Username</th>
              <th className="py-1 pr-2 font-normal">Amount</th>
              <th className="py-1 pr-2 font-normal">Paid</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.userId} className="border-t border-white/10">
                <td className="py-2 pr-2 font-semibold">{p.playerName}</td>
                <td className="py-2 pr-2 text-white/60">@{p.username}</td>
                <td className="py-2 pr-2">${p.amountDue.toFixed(2)}</td>
                <td className="py-2 pr-2">
                  <button
                    onClick={() => togglePaid(p)}
                    disabled={busyUserId === p.userId}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      p.paid ? "bg-cheese-teal/30 text-cheese-teal" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {p.paid ? "Paid ✓" : "Mark paid"}
                  </button>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-white/50">
                  No one has built a card yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/5 p-3 text-center">
      <p className={`font-display text-xl ${highlight ? "text-cheese-gold" : "text-white"}`}>{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}
