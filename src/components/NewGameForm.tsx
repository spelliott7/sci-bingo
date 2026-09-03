"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGameForm() {
  const router = useRouter();
  const [type, setType] = useState<"BINGO" | "PICK3">("BINGO");
  const [name, setName] = useState("");
  const [entryFee, setEntryFee] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          entryFee: entryFee ? Number(entryFee) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't create the game.");
        return;
      }
      router.push(`/admin/games/${json.game.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Game type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("BINGO")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              type === "BINGO"
                ? "border-cheese-gold bg-cheese-gold/20 text-cheese-gold"
                : "border-white/20 text-white/60 hover:bg-white/5"
            }`}
          >
            Bingo
          </button>
          <button
            type="button"
            onClick={() => setType("PICK3")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              type === "PICK3"
                ? "border-cheese-gold bg-cheese-gold/20 text-cheese-gold"
                : "border-white/20 text-white/60 hover:bg-white/5"
            }`}
          >
            Pick 3
          </button>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="name">
          Game name
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
          You&apos;ll add the show(s) it covers — one night or several — once it exists.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="entryFee">
          Entry fee ($)
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
        {loading ? "Creating…" : "Create game"}
      </button>
    </form>
  );
}
