"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "DRAFT" | "ACTIVE" | "COMPLETED";

/** Handles the one simple transition (DRAFT -> ACTIVE). Completing a run
 * requires picking a winner, so that lives in CompleteRunPanel instead. */
export default function RunStatusControls({ runId, status }: { runId: string; status: Status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't activate the run.");
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
