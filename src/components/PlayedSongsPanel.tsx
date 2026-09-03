"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SongTypeahead, { type SongOption } from "@/components/SongTypeahead";

type PlayedSong = {
  songId: number;
  playedAt: string;
  song: { name: string };
};

export default function PlayedSongsPanel({ showId }: { showId: string }) {
  const [songs, setSongs] = useState<SongOption[] | null>(null);
  const [playedSongs, setPlayedSongs] = useState<PlayedSong[]>([]);
  const [addSongId, setAddSongId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPlayed = useCallback(async () => {
    const res = await fetch(`/api/admin/shows/${showId}/played-songs`);
    if (res.ok) {
      const json = await res.json();
      setPlayedSongs(json.playedSongs);
    }
  }, [showId]);

  useEffect(() => {
    fetch("/api/songs")
      .then((r) => r.json())
      .then((json) => setSongs(json.songs));
  }, []);

  useEffect(() => {
    // Intentional: fetch immediately when the selected show changes, then poll for live setlist updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlayed();
    const interval = setInterval(loadPlayed, 5000);
    return () => clearInterval(interval);
  }, [loadPlayed]);

  const playedIds = useMemo(() => new Set(playedSongs.map((p) => p.songId)), [playedSongs]);

  async function handleAdd() {
    if (!addSongId) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/shows/${showId}/played-songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: addSongId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't mark that song played.");
        return;
      }
      setAddSongId(null);
      await loadPlayed();
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo(songId: number) {
    setBusy(true);
    try {
      await fetch(`/api/admin/shows/${showId}/played-songs/${songId}`, { method: "DELETE" });
      await loadPlayed();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-64">
          <label className="label">Mark a song played</label>
          {songs ? (
            <SongTypeahead songs={songs} value={addSongId} onChange={setAddSongId} excludeIds={playedIds} />
          ) : (
            <div className="field text-white/40">Loading songs…</div>
          )}
        </div>
        <button className="btn-primary" disabled={!addSongId || busy} onClick={handleAdd}>
          Mark played
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-cheese-pink">{error}</p>}

      <ol className="mt-4 space-y-1">
        {playedSongs.map((p, i) => (
          <li
            key={p.songId}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-sm"
          >
            <span>
              <span className="mr-2 text-white/40">{i + 1}.</span>
              {p.song.name}
              <span className="ml-2 text-xs text-white/40">
                {new Date(p.playedAt).toLocaleTimeString()}
              </span>
            </span>
            <button
              onClick={() => handleUndo(p.songId)}
              disabled={busy}
              className="text-xs text-white/40 hover:text-cheese-pink"
            >
              undo
            </button>
          </li>
        ))}
        {playedSongs.length === 0 && (
          <p className="text-sm text-white/50">No songs marked played yet.</p>
        )}
      </ol>
    </div>
  );
}
