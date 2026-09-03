import { describe, expect, it } from "vitest";
import { computePick3Win, getHitSongIds } from "@/lib/pick3";

describe("computePick3Win", () => {
  it("returns null when not all picks have been played", () => {
    const picks = [{ songId: 1 }, { songId: 2 }, { songId: 3 }];
    const playedSongs = [
      { songId: 1, playedAt: new Date(2026, 0, 1, 20, 0) },
      { songId: 2, playedAt: new Date(2026, 0, 1, 20, 5) },
    ];
    expect(computePick3Win(picks, playedSongs)).toBeNull();
  });

  it("returns the timestamp of the last pick played once all 3 hit", () => {
    const picks = [{ songId: 1 }, { songId: 2 }, { songId: 3 }];
    const playedSongs = [
      { songId: 1, playedAt: new Date(2026, 0, 1, 20, 0) },
      { songId: 2, playedAt: new Date(2026, 0, 1, 20, 10) },
      { songId: 3, playedAt: new Date(2026, 0, 1, 20, 5) },
    ];
    expect(computePick3Win(picks, playedSongs)).toEqual(new Date(2026, 0, 1, 20, 10));
  });

  it("only needs each pick played once, regardless of which show", () => {
    // Simulates songs logged across two different shows in the same game.
    const picks = [{ songId: 10 }, { songId: 20 }, { songId: 30 }];
    const playedSongs = [
      { songId: 10, playedAt: new Date(2026, 0, 1, 20, 0) }, // show 1
      { songId: 20, playedAt: new Date(2026, 0, 2, 20, 0) }, // show 2
      { songId: 30, playedAt: new Date(2026, 0, 2, 20, 30) }, // show 2
    ];
    expect(computePick3Win(picks, playedSongs)).toEqual(new Date(2026, 0, 2, 20, 30));
  });
});

describe("getHitSongIds", () => {
  it("returns only the picks that have been played", () => {
    const picks = [{ songId: 1 }, { songId: 2 }, { songId: 3 }];
    const hits = getHitSongIds(picks, new Set([2]));
    expect(hits).toEqual(new Set([2]));
  });
});
