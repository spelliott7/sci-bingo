/**
 * Pure Pick 3 logic: a player picks 3 songs; the pick "hits" once all 3 have
 * been played (at any show the game includes). Mirrors the spirit of
 * lib/bingo.ts's computeFirstBingo but for a flat set of 3 songs instead of
 * a 5x5 grid of win-lines.
 */

export const PICK3_COUNT = 3;

export type Pick3PickLike = {
  songId: number;
};

export type PlayedSongLike = {
  songId: number;
  playedAt: Date;
};

/** The moment (if any) all 3 picks have been played — the timestamp of whichever was played last. */
export function computePick3Win(
  picks: Pick3PickLike[],
  playedSongs: PlayedSongLike[],
): Date | null {
  const playedAtBySongId = new Map<number, Date>();
  for (const played of playedSongs) {
    playedAtBySongId.set(played.songId, played.playedAt);
  }

  let latest: Date = new Date(0);
  for (const pick of picks) {
    const playedAt = playedAtBySongId.get(pick.songId);
    if (!playedAt) return null;
    if (playedAt > latest) latest = playedAt;
  }
  return latest;
}

export function getHitSongIds(
  picks: Pick3PickLike[],
  playedSongIds: ReadonlySet<number>,
): Set<number> {
  const hits = new Set<number>();
  for (const pick of picks) {
    if (playedSongIds.has(pick.songId)) hits.add(pick.songId);
  }
  return hits;
}
