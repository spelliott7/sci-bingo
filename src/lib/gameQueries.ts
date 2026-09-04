import { prisma } from "@/lib/db";

/** All songs played at any show this game includes, across the whole game. */
export async function getPlayedSongsForGame(gameId: string) {
  return prisma.playedSong.findMany({
    where: { show: { games: { some: { gameId } } } },
    include: { song: true },
    orderBy: { playedAt: "asc" },
  });
}

export async function getShowsForGame(gameId: string) {
  const gameShows = await prisma.gameShow.findMany({
    where: { gameId },
    include: { show: true },
    orderBy: { show: { showDate: "asc" } },
  });
  return gameShows.map((gs) => gs.show);
}

/**
 * The moment new entries stop being accepted and existing ones can no
 * longer be edited: the start time of the earliest show this game covers.
 * Null if no show has been scheduled yet, in which case there's no cutoff.
 */
export async function getEntryLockAt(gameId: string): Promise<Date | null> {
  const earliest = await prisma.gameShow.findFirst({
    where: { gameId },
    include: { show: true },
    orderBy: { show: { showDate: "asc" } },
  });
  return earliest?.show.showDate ?? null;
}
