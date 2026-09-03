"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewRunForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [entryFee, setEntryFee] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          entryFee: entryFee ? Number(entryFee) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't create the run.");
        return;
      }
      router.push(`/admin/runs/${json.run.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Run name
        </label>
        <input
          id="name"
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Colorado Run — Sept 2026"
          required
        />
        <p className="mt-1 text-xs text-white/40">
          You&apos;ll add the individual shows (with their own venue/date) once the run exists.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="entryFee">
          Entry fee ($, covers the whole run)
        </label>
        <input
          id="entryFee"
          type="number"
          min="0"
          step="0.01"
          className="field"
          value={entryFee}
          onChange={(e) => setEntryFee(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-cheese-pink">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Creating…" : "Create run"}
      </button>
    </form>
  );
}
