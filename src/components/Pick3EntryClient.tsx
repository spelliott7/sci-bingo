"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SongTypeahead, { type SongOption } from "@/components/SongTypeahead";
import VenmoPaymentPrompt from "@/components/VenmoPaymentPrompt";
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
    venmoHandle: string | null;
    winnerEntryIds: string[];
  } | null;
  shows: { id: string; name: string | null; venue: string | null; showDate: string }[];
  payment: { paid: boolean; amountDue: number } | null;
  entryLockAt: string | null;
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
  const [isEditing, setIsEditing] = useState(false);

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

  const entryLockAt = data?.entryLockAt ? new Date(data.entryLockAt) : null;
  const isLocked = entryLockAt !== null && entryLockAt <= new Date();

  function startEditing() {
    if (!data?.entry) return;
    setPlayerName(data.entry.playerName);
    setPicks(data.entry.picks.map((p) => p.songId));
    setError(null);
    setIsEditing(true);
  }

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
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim(), songIds: picks }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't save your entry.");
        return;
      }
      setIsEditing(false);
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

  if (data.entry && !isEditing) {
    const isDeclaredWinner = data.game.winnerEntryIds.includes(data.entry.id);
    return (
      <div>
        {isDeclaredWinner && (
          <div className="mb-4 rounded-xl border border-cheese-gold bg-cheese-gold/20 p-4 text-center">
            <p className="font-display text-2xl text-cheese-gold">
              {data.game.winnerEntryIds.length > 1 ? "You tied for the win! 🎉" : "You won! 🎉"}
            </p>
            {data.game.winnerEntryIds.length > 1 && (
              <p className="text-sm text-white/70">
                More than one entry hit at the same moment — the pot gets split.
              </p>
            )}
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
          <p className="mb-2 text-xs text-white/40">
            Shows: {data.shows.map((s) => new Date(s.showDate).toLocaleDateString()).join(", ")}
          </p>
        )}
        {data.game.status === "ACTIVE" &&
          (isLocked ? (
            <p className="mb-4 text-xs text-cheese-pink">
              Entries are locked — the show has started, so this entry can no longer be edited.
            </p>
          ) : (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
              <p className="text-xs text-white/50">
                {entryLockAt
                  ? `You can edit this entry until ${entryLockAt.toLocaleString()}.`
                  : "You can edit this entry until the admin adds a show and it starts."}
              </p>
              <button className="btn-secondary shrink-0 text-xs" onClick={startEditing}>
                Edit my entry
              </button>
            </div>
          ))}
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

        {data.game.venmoHandle && data.payment && (
          <div className="mt-6">
            {data.payment.paid ? (
              <p className="text-center text-sm text-cheese-teal">✓ You&apos;re paid up for this game.</p>
            ) : (
              <VenmoPaymentPrompt
                venmoHandle={data.game.venmoHandle}
                amount={data.payment.amountDue}
                note={data.game.name}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  if (!songs) {
    return <p className="text-white/70">Loading songs…</p>;
  }

  if (isLocked && !data.entry) {
    return (
      <p className="text-white/70">
        Entries closed once the show started — no new entries can be created for this game
        anymore.
      </p>
    );
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
      <p className="mb-1 text-sm text-white/60">
        Pick 3 different songs. You hit if all 3 get played at any show in this game.
      </p>
      {entryLockAt && (
        <p className="mb-3 text-xs text-white/40">
          {isEditing ? "Edit" : "Entries"} close at {entryLockAt.toLocaleString()}, when the show
          starts.
        </p>
      )}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
      <div className="mt-4 flex gap-2">
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
          {submitting
            ? "Saving…"
            : isEditing
              ? "Save changes"
              : `Save my entry ($${Number(data.game.entryFee).toFixed(2)} to play)`}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn-secondary"
            disabled={submitting}
            onClick={() => {
              setIsEditing(false);
              setError(null);
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
