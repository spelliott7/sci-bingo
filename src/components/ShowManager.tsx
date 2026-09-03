"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PlayedSongsPanel from "@/components/PlayedSongsPanel";

type Show = {
  id: string;
  name: string | null;
  venue: string | null;
  showDate: string;
  _count: { playedSongs: number };
};

type AllShow = {
  id: string;
  name: string | null;
  venue: string | null;
  showDate: string;
};

export default function ShowManager({ gameId }: { gameId: string }) {
  const [shows, setShows] = useState<Show[] | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadShows = useCallback(async () => {
    const res = await fetch(`/api/admin/games/${gameId}/shows`);
    if (res.ok) {
      const json = await res.json();
      setShows(json.shows);
      setSelectedShowId((current) => {
        if (current && json.shows.some((s: Show) => s.id === current)) return current;
        return json.shows.length > 0 ? json.shows[json.shows.length - 1].id : null;
      });
    }
  }, [gameId]);

  useEffect(() => {
    // Intentional: fetch the show list on mount (and whenever gameId changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadShows();
  }, [loadShows]);

  if (!shows) {
    return <p className="text-white/50">Loading shows…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {shows.map((show) => (
          <button
            key={show.id}
            onClick={() => setSelectedShowId(show.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              selectedShowId === show.id
                ? "bg-cheese-gold text-cheese-ink"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {show.name || new Date(show.showDate).toLocaleDateString()}
            <span className="ml-1.5 text-xs opacity-70">({show._count.playedSongs})</span>
          </button>
        ))}
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-full border border-dashed border-white/30 px-3 py-1.5 text-sm text-white/60 hover:border-cheese-gold hover:text-cheese-gold"
        >
          + Add show
        </button>
      </div>

      {showAddForm && (
        <AddShowForm
          gameId={gameId}
          attachedIds={new Set(shows.map((s) => s.id))}
          onCreated={async (showId) => {
            setShowAddForm(false);
            await loadShows();
            setSelectedShowId(showId);
          }}
        />
      )}

      {shows.length === 0 && !showAddForm && (
        <p className="mt-3 text-sm text-white/50">
          Add the first show this game covers to start marking songs played.
        </p>
      )}

      {selectedShowId && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <PlayedSongsPanel showId={selectedShowId} />
        </div>
      )}
    </div>
  );
}

function AddShowForm({
  gameId,
  attachedIds,
  onCreated,
}: {
  gameId: string;
  attachedIds: ReadonlySet<string>;
  onCreated: (showId: string) => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [allShows, setAllShows] = useState<AllShow[] | null>(null);
  const [pickedShowId, setPickedShowId] = useState("");
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [showDate, setShowDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/shows")
      .then((r) => r.json())
      .then((json) => setAllShows(json.shows));
  }, []);

  const availableShows = useMemo(
    () => (allShows ?? []).filter((s) => !attachedIds.has(s.id)),
    [allShows, attachedIds],
  );

  async function attachExisting() {
    if (!pickedShowId) {
      setError("Pick a show to add.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/shows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId: pickedShowId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't add that show.");
        return;
      }
      onCreated(json.show.id);
    } finally {
      setLoading(false);
    }
  }

  async function createAndAttach(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/shows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, venue, showDate }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't add that show.");
        return;
      }
      onCreated(json.show.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-white/5 p-3">
      <div className="mb-3 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`rounded-full px-3 py-1 font-semibold ${
            mode === "existing" ? "bg-cheese-gold text-cheese-ink" : "bg-white/10 text-white/60"
          }`}
        >
          Use an existing show
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`rounded-full px-3 py-1 font-semibold ${
            mode === "new" ? "bg-cheese-gold text-cheese-ink" : "bg-white/10 text-white/60"
          }`}
        >
          Create a new show
        </button>
      </div>

      {mode === "existing" ? (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label">Show</label>
            {allShows === null ? (
              <div className="field w-64 text-white/40">Loading…</div>
            ) : (
              <select
                className="field w-64"
                value={pickedShowId}
                onChange={(e) => setPickedShowId(e.target.value)}
              >
                <option value="">Select a show…</option>
                {availableShows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ? `${s.name} — ` : ""}
                    {s.venue ? `${s.venue}, ` : ""}
                    {new Date(s.showDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
            {allShows !== null && availableShows.length === 0 && (
              <p className="mt-1 text-xs text-white/40">
                No other shows yet — create a new one instead.
              </p>
            )}
          </div>
          <button type="button" className="btn-primary" disabled={loading} onClick={attachExisting}>
            {loading ? "Adding…" : "Add"}
          </button>
        </div>
      ) : (
        <form onSubmit={createAndAttach} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label">Label (optional)</label>
            <input
              className="field w-32"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Night 1"
            />
          </div>
          <div>
            <label className="label">Venue (optional)</label>
            <input className="field w-40" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="datetime-local"
              className="field"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Adding…" : "Add"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-cheese-pink">{error}</p>}
    </div>
  );
}
