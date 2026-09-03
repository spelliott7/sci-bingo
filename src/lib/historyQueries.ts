import { prisma } from "@/lib/db";
import { computeFirstBingo, getMarkedPositions } from "@/lib/bingo";

export async function getCompletedRunsForUser(userId: string) {
  const runs = await prisma.run.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  const results = await Promise.all(
    runs.map(async (run) => {
      const [card, playedSongs] = await Promise.all([
        prisma.bingoCard.findUnique({
          where: { runId_userId: { runId: run.id, userId } },
          include: { squares: true },
        }),
        prisma.playedSong.findMany({ where: { show: { runId: run.id } } }),
      ]);

      let wonBingoAt: string | null = null;
      if (card) {
        const result = computeFirstBingo(card.squares, playedSongs);
        wonBingoAt = result ? result.playedAt.toISOString() : null;
      }

      return {
        id: run.id,
        name: run.name,
        completedAt: run.completedAt,
        myCard: card
          ? {
              playerName: card.playerName,
              wonBingoAt,
              isWinner: run.winnerCardId === card.id,
            }
          : null,
      };
    }),
  );

  const stats = {
    totalRunsPlayed: results.filter((r) => r.myCard).length,
    totalWins: results.filter((r) => r.myCard?.isWinner).length,
  };

  return { runs: results, stats };
}

export async function getRunHistoryDetail(runId: string, viewerUserId: string) {
  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) return null;

  const [shows, cards] = await Promise.all([
    prisma.show.findMany({
      where: { runId },
      include: {
        playedSongs: { include: { song: true }, orderBy: { playedAt: "asc" } },
      },
      orderBy: { showDate: "asc" },
    }),
    prisma.bingoCard.findMany({
      where: { runId },
      include: {
        user: { select: { username: true } },
        squares: { include: { song: true }, orderBy: { position: "asc" } },
      },
    }),
  ]);

  const playedSongs = shows.flatMap((show) => show.playedSongs);
  const playedSongIds = new Set(playedSongs.map((p) => p.songId));

  const results = cards
    .map((card) => {
      const bingo = computeFirstBingo(card.squares, playedSongs);
      return {
        cardId: card.id,
        playerName: card.playerName,
        username: card.user.username,
        isMe: card.userId === viewerUserId,
        isWinner: run.winnerCardId === card.id,
        wonBingoAt: bingo ? bingo.playedAt.toISOString() : null,
        markedCount: getMarkedPositions(card.squares, playedSongIds).size,
        squares: card.squares.map((s) => ({
          position: s.position,
          songId: s.songId,
          songName: s.song?.name ?? null,
        })),
      };
    })
    .sort((a, b) => {
      if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
      if (a.wonBingoAt && b.wonBingoAt) return a.wonBingoAt.localeCompare(b.wonBingoAt);
      if (a.wonBingoAt) return -1;
      if (b.wonBingoAt) return 1;
      return b.markedCount - a.markedCount;
    });

  return {
    run,
    shows: shows.map((s) => ({
      id: s.id,
      name: s.name,
      venue: s.venue,
      showDate: s.showDate,
      playedSongs: s.playedSongs.map((p) => ({
        songId: p.songId,
        songName: p.song.name,
        playedAt: p.playedAt,
      })),
    })),
    results,
  };
}
