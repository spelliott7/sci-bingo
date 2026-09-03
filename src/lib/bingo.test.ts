import { describe, expect, it } from "vitest";
import {
  FREE_POSITION,
  computeFirstBingo,
  getCompletedLines,
  getMarkedPositions,
  hasBingo,
} from "@/lib/bingo";

function buildSquares() {
  // 24 songs (ids 1-24) filled in position order, skipping the free center.
  const squares: { position: number; songId: number | null }[] = [];
  let songId = 1;
  for (let position = 0; position < 25; position++) {
    if (position === FREE_POSITION) {
      squares.push({ position, songId: null });
    } else {
      squares.push({ position, songId: songId++ });
    }
  }
  return squares;
}

describe("getMarkedPositions", () => {
  it("always marks the free square", () => {
    const squares = buildSquares();
    const marked = getMarkedPositions(squares, new Set());
    expect(marked.has(FREE_POSITION)).toBe(true);
  });

  it("marks squares whose song has been played", () => {
    const squares = buildSquares();
    const marked = getMarkedPositions(squares, new Set([1, 2, 3]));
    expect(marked.has(0)).toBe(true);
    expect(marked.has(1)).toBe(true);
    expect(marked.has(2)).toBe(true);
    expect(marked.has(3)).toBe(false);
  });
});

describe("hasBingo / getCompletedLines", () => {
  it("detects a completed top row", () => {
    const squares = buildSquares();
    // top row is positions 0-4 -> songIds 1,2,3,4,5
    const marked = getMarkedPositions(squares, new Set([1, 2, 3, 4, 5]));
    expect(hasBingo(marked)).toBe(true);
    expect(getCompletedLines(marked)).toContainEqual([0, 1, 2, 3, 4]);
  });

  it("the middle row is completed by only 4 songs thanks to the free square", () => {
    const squares = buildSquares();
    // middle row is positions 10-14 -> songIds 11,12,FREE,13,14
    const marked = getMarkedPositions(squares, new Set([11, 12, 13, 14]));
    expect(hasBingo(marked)).toBe(true);
  });

  it("is false with no songs played", () => {
    const squares = buildSquares();
    const marked = getMarkedPositions(squares, new Set());
    expect(hasBingo(marked)).toBe(false);
  });
});

describe("computeFirstBingo", () => {
  it("returns null when no line is complete", () => {
    const squares = buildSquares();
    const result = computeFirstBingo(squares, [{ songId: 1, playedAt: new Date("2026-01-01") }]);
    expect(result).toBeNull();
  });

  it("returns the earliest-completing line's timestamp", () => {
    const squares = buildSquares();
    // Complete the top row (songIds 1-5) at increasing timestamps; last one (5) finishes it.
    const playedSongs = [1, 2, 3, 4, 5].map((songId, i) => ({
      songId,
      playedAt: new Date(2026, 0, 1, 20, i),
    }));
    const result = computeFirstBingo(squares, playedSongs);
    expect(result).not.toBeNull();
    expect(result?.line).toEqual([0, 1, 2, 3, 4]);
    expect(result?.playedAt).toEqual(new Date(2026, 0, 1, 20, 4));
  });

  it("picks the line that completes earliest, not the first one checked", () => {
    const squares = buildSquares();
    // Top row (0-4 -> songs 1-5) finishes late; first column (0,5,10,15,20 -> songs 1,6,11,15,20) finishes early.
    const playedSongs = [
      { songId: 1, playedAt: new Date(2026, 0, 1, 20, 0) },
      { songId: 2, playedAt: new Date(2026, 0, 1, 20, 10) },
      { songId: 3, playedAt: new Date(2026, 0, 1, 20, 20) },
      { songId: 4, playedAt: new Date(2026, 0, 1, 20, 30) },
      { songId: 5, playedAt: new Date(2026, 0, 1, 20, 40) },
      { songId: 6, playedAt: new Date(2026, 0, 1, 20, 1) },
      { songId: 11, playedAt: new Date(2026, 0, 1, 20, 2) },
      { songId: 15, playedAt: new Date(2026, 0, 1, 20, 3) },
      { songId: 20, playedAt: new Date(2026, 0, 1, 20, 4) },
    ];
    const result = computeFirstBingo(squares, playedSongs);
    expect(result?.line).toEqual([0, 5, 10, 15, 20]);
    expect(result?.playedAt).toEqual(new Date(2026, 0, 1, 20, 4));
  });
});
