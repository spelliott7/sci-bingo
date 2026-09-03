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
