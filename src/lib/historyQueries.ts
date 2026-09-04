import { prisma } from "@/lib/db";
import { computeFirstBingo, getMarkedPositions } from "@/lib/bingo";
import { computePick3Win } from "@/lib/pick3";
import { getPlayedSongsForGame } from "@/lib/gameQueries";

export async function getCompletedGamesForUser(userId: string) {
  const games = await prisma.game.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  const results = await Promise.all(
    games.map(async (game) => {
      const playedSongs = await getPlayedSongsForGame(game.id);

      let myResult: { playerName: string; wonAt: string | null; isWinner: boolean } | null = null;

      if (game.type === "BINGO") {
        const card = await prisma.bingoCard.findUnique({
          where: { gameId_userId: { gameId: game.id, userId } },
          include: { squares: true },
        });
        if (card) {
          const bingo = computeFirstBingo(card.squares, playedSongs);
          myResult = {
            playerName: card.playerName,
            wonAt: bingo ? bingo.playedAt.toISOString() : null,
            isWinner: game.winnerCardIds.includes(card.id),
          };
        }
      } else {
        const entry = await prisma.pick3Entry.findUnique({
          where: { gameId_userId: { gameId: game.id, userId } },
          include: { picks: true },
        });
        if (entry) {
          const wonAt = computePick3Win(entry.picks, playedSongs);
          myResult = {
            playerName: entry.playerName,
            wonAt: wonAt ? wonAt.toISOString() : null,
            isWinner: game.winnerEntryIds.includes(entry.id),
          };
        }
      }

      return {
        id: game.id,
        type: game.type,
        name: game.name,
        completedAt: game.completedAt,
        myResult,
      };
    }),
  );

  const stats = {
    totalGamesPlayed: results.filter((r) => r.myResult).length,
    totalWins: results.filter((r) => r.myResult?.isWinner).length,
  };

  return { games: results, stats };
}

export async function getGameHistoryDetail(gameId: string, viewerUserId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return null;

  const gameShows = await prisma.gameShow.findMany({
    where: { gameId },
    include: {
      show: {
        include: { playedSongs: { include: { song: true }, orderBy: { playedAt: "asc" } } },
      },
    },
    orderBy: { show: { showDate: "asc" } },
  });
  const shows = gameShows.map((gs) => ({
    id: gs.show.id,
    name: gs.show.name,
    venue: gs.show.venue,
    showDate: gs.show.showDate,
    playedSongs: gs.show.playedSongs.map((p) => ({
      songId: p.songId,
      songName: p.song.name,
      playedAt: p.playedAt,
    })),
  }));

  const playedSongs = shows.flatMap((s) => s.playedSongs);
  const playedSongIds = new Set(playedSongs.map((p) => p.songId));

  if (game.type === "BINGO") {
    const cards = await prisma.bingoCard.findMany({
      where: { gameId },
      include: {
        user: { select: { username: true } },
        squares: { include: { song: true }, orderBy: { position: "asc" } },
      },
    });

    const results = cards
      .map((card) => {
        const bingo = computeFirstBingo(card.squares, playedSongs);
        return {
          entryId: card.id,
          playerName: card.playerName,
          username: card.user.username,
          isMe: card.userId === viewerUserId,
          isWinner: game.winnerCardIds.includes(card.id),
          wonAt: bingo ? bingo.playedAt.toISOString() : null,
          markedCount: getMarkedPositions(card.squares, playedSongIds).size,
          squares: card.squares.map((s) => ({
            position: s.position,
            songId: s.songId,
            songName: s.song?.name ?? null,
          })),
        };
      })
      .sort(sortResults);

    return { game, shows, results };
  }

  const entries = await prisma.pick3Entry.findMany({
    where: { gameId },
    include: {
      user: { select: { username: true } },
      picks: { include: { song: true } },
    },
  });

  const results = entries
    .map((entry) => {
      const wonAt = computePick3Win(entry.picks, playedSongs);
      return {
        entryId: entry.id,
        playerName: entry.playerName,
        username: entry.user.username,
        isMe: entry.userId === viewerUserId,
        isWinner: game.winnerEntryIds.includes(entry.id),
        wonAt: wonAt ? wonAt.toISOString() : null,
        markedCount: entry.picks.filter((p) => playedSongIds.has(p.songId)).length,
        picks: entry.picks.map((p) => ({ songId: p.songId, songName: p.song.name })),
      };
    })
    .sort(sortResults);

  return { game, shows, results };
}

function sortResults(
  a: { isWinner: boolean; wonAt: string | null; markedCount: number },
  b: { isWinner: boolean; wonAt: string | null; markedCount: number },
) {
  if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
  if (a.wonAt && b.wonAt) return a.wonAt.localeCompare(b.wonAt);
  if (a.wonAt) return -1;
  if (b.wonAt) return 1;
  return b.markedCount - a.markedCount;
}
