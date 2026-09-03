/**
 * Pure bingo-grid logic for the 5x5 card (position 12 is always the FREE square).
 * Kept dependency-free and framework-agnostic so it's easy to unit test.
 */

export const GRID_SIZE = 5;
export const FREE_POSITION = 12;
export const CARD_SIZE = GRID_SIZE * GRID_SIZE;

export const WIN_LINES: number[][] = [
  // rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export type CardSquareLike = {
  position: number;
  songId: number | null;
};

/** A square is marked if it's the free space, or its song has been played. */
export function getMarkedPositions(
  squares: CardSquareLike[],
  playedSongIds: ReadonlySet<number>,
): Set<number> {
  const marked = new Set<number>();
  for (const square of squares) {
    if (square.songId === null || playedSongIds.has(square.songId)) {
      marked.add(square.position);
    }
  }
  return marked;
}

export function getCompletedLines(marked: ReadonlySet<number>): number[][] {
  return WIN_LINES.filter((line) => line.every((pos) => marked.has(pos)));
}

export function hasBingo(marked: ReadonlySet<number>): boolean {
  return getCompletedLines(marked).length > 0;
}

export type PlayedSongLike = {
  songId: number;
  playedAt: Date;
};

export type BingoResult = {
  playedAt: Date;
  line: number[];
};

/**
 * Determines the moment (if any) this card first completed a line, based on
 * when each of its songs was played. A line's completion time is the latest
 * playedAt among its non-free squares; the card's overall bingo time is the
 * earliest such moment across all 12 lines.
 */
export function computeFirstBingo(
  squares: CardSquareLike[],
  playedSongs: PlayedSongLike[],
): BingoResult | null {
  const playedAtBySongId = new Map<number, Date>();
  for (const played of playedSongs) {
    playedAtBySongId.set(played.songId, played.playedAt);
  }

  const songIdByPosition = new Map<number, number | null>();
  for (const square of squares) {
    songIdByPosition.set(square.position, square.songId);
  }

  let best: BingoResult | null = null;

  for (const line of WIN_LINES) {
    let completionTime: Date | null = new Date(0);
    for (const position of line) {
      const songId = songIdByPosition.get(position) ?? null;
      if (songId === null) continue; // free square, always satisfied
      const playedAt = playedAtBySongId.get(songId);
      if (!playedAt) {
        completionTime = null;
        break;
      }
      if (playedAt > completionTime) {
        completionTime = playedAt;
      }
    }

    if (completionTime && (!best || completionTime < best.playedAt)) {
      best = { playedAt: completionTime, line };
    }
  }

  return best;
}
