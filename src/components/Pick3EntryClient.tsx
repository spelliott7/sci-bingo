"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SongTypeahead, { type SongOption } from "@/components/SongTypeahead";
import { PICK3_COUNT, computePick3Win, getHitSongIds } from "@/lib/pick3";

type EntryResponse = {
  entry: {
    id: string;
    playerName: string;
    picks: { songId: number; song: { name: string } }[];
  } | null;
  playedSongs: { songId: number; playedAt: string }[];
  game: {
    id: string;
    name: string;
    status: string;
    entryFee: string | number;
    winnerEntryId: string | null;
  } | null;
  shows: { id: string; name: string | null; venue: string | null; showDate: string }[];
};

export default function Pick3EntryClient({
  gameId,
  defaultPlayerName,
}: {
  gameId: string;
  defaultPlayerName: string;
}) {
  const [songs, setSongs] = useState<SongOption[] | null>(null);
  const [data, setData] = useState<EntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [picks, setPicks] = useState<(number | null)[]>(Array(PICK3_COUNT).fill(null));
  const [submitting, setSubmitting] = useState(false);

  const loadEntry = useCallback(async () => {
    const res = await fetch(`/api/games/${gameId}/picks/me`);
    if (res.ok) {
      const json: EntryResponse = await res.json();
      setData(json);
    }
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const [songsRes] = await Promise.all([fetch("/api/songs"), loadEntry()]);
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
  }, [loadEntry]);

  useEffect(() => {
    if (!data?.entry || data.game?.status === "COMPLETED") return;
    const interval = setInterval(loadEntry, 7000);
    return () => clearInterval(interval);
  }, [data?.entry, data?.game?.status, loadEntry]);

  const playedSongIds = useMemo(
    () => new Set((data?.playedSongs ?? []).map((p) => p.songId)),
    [data?.playedSongs],
  );

  const entryPicks = useMemo(() => data?.entry?.picks ?? [], [data]);
  const hitSongIds = useMemo(() => getHitSongIds(entryPicks, playedSongIds), [entryPicks, playedSongIds]);
  const isHit = entryPicks.length > 0 && hitSongIds.size === entryPicks.length;

  const winTime = useMemo(() => {
    if (!data?.entry || !data.playedSongs) return null;
    return computePick3Win(
      entryPicks,
      data.playedSongs.map((p) => ({ songId: p.songId, playedAt: new Date(p.playedAt) })),
    );
  }, [data, entryPicks]);

  async function handleSubmit() {
    setError(null);
    if (picks.some((p) => p === null)) {
      setError("Pick 3 songs before saving your entry.");
      return;
    }
    if (!playerName.trim()) {
      setError("Enter a name so we know it's your entry.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${gameId}/picks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim(), songIds: picks }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't save your entry.");
        return;
      }
      await loadEntry();
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

  if (data.game.status !== "ACTIVE" && !data.entry) {
    return (
      <p className="text-white/70">
        This game isn&apos;t open for entries right now — check back once the admin activates it.
      </p>
    );
  }

  if (data.entry) {
    const isDeclaredWinner = data.game.winnerEntryId === data.entry.id;
    return (
      <div>
        {isDeclaredWinner && (
          <div className="mb-4 rounded-xl border border-cheese-gold bg-cheese-gold/20 p-4 text-center">
            <p className="font-display text-2xl text-cheese-gold">You won! 🎉</p>
          </div>
        )}
        {!isDeclaredWinner && isHit && (
          <div className="mb-4 rounded-xl border border-cheese-gold bg-cheese-gold/20 p-4 text-center">
            <p className="font-display text-2xl text-cheese-gold">You hit all 3!</p>
            {winTime && (
              <p className="text-sm text-white/70">
                Completed at {winTime.toLocaleTimeString()}
                {data.game.status !== "COMPLETED" &&
                  " — the admin will confirm the winner once the game wraps up."}
              </p>
            )}
          </div>
        )}
        <p className="mb-3 text-sm text-white/60">
          Playing as <span className="font-semibold text-white">{data.entry.playerName}</span> in{" "}
          <span className="font-semibold text-white">{data.game.name}</span>
        </p>
        {data.shows.length > 0 && (
          <p className="mb-4 text-xs text-white/40">
            Shows: {data.shows.map((s) => new Date(s.showDate).toLocaleDateString()).join(", ")}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {data.entry.picks.map((pick) => {
            const hit = hitSongIds.has(pick.songId);
            return (
              <div
                key={pick.songId}
                className={`rounded-xl border p-4 text-center font-semibold ${
                  hit
                    ? "mark-pop border-cheese-gold bg-cheese-gold/20 text-cheese-gold shadow-glow"
                    : "border-white/15 bg-white/5 text-white/80"
                }`}
              >
                {pick.song.name}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!songs) {
    return <p className="text-white/70">Loading songs…</p>;
  }

  const selectedIds = new Set(picks.filter((p): p is number => p !== null));

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <label className="label" htmlFor="playerName">
          Name on this entry
        </label>
        <input
          id="playerName"
          className="field"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={60}
        />
      </div>
      <p className="mb-3 text-sm text-white/60">
        Pick 3 different songs. You hit if all 3 get played at any show in this game.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {picks.map((songId, i) => {
          const excludeIds = new Set(selectedIds);
          if (songId !== null) excludeIds.delete(songId);
          return (
            <SongTypeahead
              key={i}
              songs={songs}
              value={songId}
              excludeIds={excludeIds}
              onChange={(id) =>
                setPicks((prev) => prev.map((p, idx) => (idx === i ? id : p)))
              }
              placeholder={`Pick ${i + 1}…`}
            />
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-cheese-pink">{error}</p>}
      <button onClick={handleSubmit} disabled={submitting} className="btn-primary mt-4">
        {submitting
          ? "Saving…"
          : `Save my entry ($${Number(data.game.entryFee).toFixed(2)} to play)`}
      </button>
    </div>
  );
}
