import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import RunStatusControls from "@/components/RunStatusControls";
import CompleteRunPanel from "@/components/CompleteRunPanel";
import ShowManager from "@/components/ShowManager";
import PlayersPaymentsPanel from "@/components/PlayersPaymentsPanel";

export default async function AdminRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const session = await getSession();
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { winnerCard: { include: { user: { select: { username: true } } } } },
  });
  if (!run) notFound();

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">{run.name}</h1>
            <p className="text-white/60">${Number(run.entryFee).toFixed(2)} entry per card</p>
          </div>
          <RunStatusControls runId={run.id} status={run.status} />
        </div>

        {run.status === "COMPLETED" && (
          <div className="panel mt-6 border-cheese-gold/50 text-center">
            {run.winnerCard ? (
              <p className="font-display text-xl text-cheese-gold">
                🏆 {run.winnerCard.playerName} (@{run.winnerCard.user.username}) won this run!
              </p>
            ) : (
              <p className="text-white/60">This run wrapped up without a declared winner.</p>
            )}
          </div>
        )}

        <section className="panel mt-6">
          <h2 className="font-display text-lg text-cheese-teal">Shows &amp; setlists</h2>
          <div className="mt-3">
            <ShowManager runId={run.id} />
          </div>
        </section>

        <section className="panel mt-6">
          <h2 className="font-display text-lg text-cheese-teal">Players &amp; payments</h2>
          <div className="mt-3">
            <PlayersPaymentsPanel runId={run.id} />
          </div>
        </section>

        {run.status === "ACTIVE" && <CompleteRunPanel runId={run.id} />}
      </main>
    </>
  );
}
