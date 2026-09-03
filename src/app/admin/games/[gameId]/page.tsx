import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import GameStatusControls from "@/components/GameStatusControls";
import CompleteGamePanel from "@/components/CompleteGamePanel";
import ShowManager from "@/components/ShowManager";
import PlayersPaymentsPanel from "@/components/PlayersPaymentsPanel";

const TYPE_LABEL: Record<string, string> = { BINGO: "Bingo", PICK3: "Pick 3" };

export default async function AdminGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const session = await getSession();
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      winnerCard: { include: { user: { select: { username: true } } } },
      winnerEntry: { include: { user: { select: { username: true } } } },
    },
  });
  if (!game) notFound();

  const winner = game.winnerCard ?? game.winnerEntry;

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">{game.name}</h1>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
                {TYPE_LABEL[game.type]}
              </span>
            </div>
            <p className="text-white/60">${Number(game.entryFee).toFixed(2)} entry per player</p>
          </div>
          <GameStatusControls gameId={game.id} status={game.status} />
        </div>

        {game.status === "COMPLETED" && (
          <div className="panel mt-6 border-cheese-gold/50 text-center">
            {winner ? (
              <p className="font-display text-xl text-cheese-gold">
                🏆 {winner.playerName} (@{winner.user.username}) won this game!
              </p>
            ) : (
              <p className="text-white/60">This game wrapped up without a declared winner.</p>
            )}
          </div>
        )}

        <section className="panel mt-6">
          <h2 className="font-display text-lg text-cheese-teal">Shows &amp; setlists</h2>
          <div className="mt-3">
            <ShowManager gameId={game.id} />
          </div>
        </section>

        <section className="panel mt-6">
          <h2 className="font-display text-lg text-cheese-teal">Players &amp; payments</h2>
          <div className="mt-3">
            <PlayersPaymentsPanel gameId={game.id} />
          </div>
        </section>

        {game.status === "ACTIVE" && <CompleteGamePanel gameId={game.id} type={game.type} />}
      </main>
    </>
  );
}
