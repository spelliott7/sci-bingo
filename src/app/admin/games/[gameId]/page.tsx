import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import GameStatusControls from "@/components/GameStatusControls";
import CompleteGamePanel from "@/components/CompleteGamePanel";
import ShowManager from "@/components/ShowManager";
import PlayersPaymentsPanel from "@/components/PlayersPaymentsPanel";
import VenmoHandleEditor from "@/components/VenmoHandleEditor";

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
    include: { _count: { select: { shows: true } } },
  });
  if (!game) notFound();

  const winners =
    game.status === "COMPLETED"
      ? game.type === "BINGO"
        ? await prisma.bingoCard.findMany({
            where: { id: { in: game.winnerCardIds } },
            include: { user: { select: { username: true } } },
          })
        : await prisma.pick3Entry.findMany({
            where: { id: { in: game.winnerEntryIds } },
            include: { user: { select: { username: true } } },
          })
      : [];

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
            <div className="mt-1">
              <VenmoHandleEditor gameId={game.id} venmoHandle={game.venmoHandle} />
            </div>
          </div>
          <GameStatusControls gameId={game.id} status={game.status} />
        </div>

        {game.status === "DRAFT" && (
          <div className="panel mt-6 border-cheese-teal/40">
            <h2 className="font-display text-lg text-cheese-teal">Before you activate</h2>
            <ul className="mt-2 space-y-1 text-sm">
              <li className={game.venmoHandle ? "text-white/50 line-through" : "text-white/80"}>
                {game.venmoHandle ? "✓" : "☐"} Set your Venmo handle above, so players see a
                pay-via-Venmo prompt right after entering (or skip this if you&apos;re collecting
                another way).
              </li>
              <li className={game._count.shows > 0 ? "text-white/50 line-through" : "text-white/80"}>
                {game._count.shows > 0 ? "✓" : "☐"} Add at least one show below.
              </li>
              <li className="text-white/80">
                ☐ Hit <span className="font-semibold text-cheese-gold">Activate</span> above once
                you&apos;re ready for players to start entering.
              </li>
            </ul>
          </div>
        )}

        {game.status === "COMPLETED" && (
          <div className="panel mt-6 border-cheese-gold/50 text-center">
            {winners.length > 0 ? (
              <p className="font-display text-xl text-cheese-gold">
                🏆{" "}
                {winners.map((w) => `${w.playerName} (@${w.user.username})`).join(" & ")}{" "}
                {winners.length > 1 ? "tied to win this game — split the pot!" : "won this game!"}
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
