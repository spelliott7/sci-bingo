import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import RunStatusControls from "@/components/RunStatusControls";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-white/10 text-white/60",
  ACTIVE: "bg-cheese-teal/30 text-cheese-teal",
  COMPLETED: "bg-cheese-gold/20 text-cheese-gold",
};

export default async function AdminHomePage() {
  const session = await getSession();
  const runs = await prisma.run.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true, shows: true } } },
  });

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">Admin</h1>
          <Link href="/admin/runs/new" className="btn-primary">
            + New run
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {runs.length === 0 && (
            <p className="text-white/60">No runs yet — create one to get started.</p>
          )}
          {runs.map((run) => (
            <div key={run.id} className="panel flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/runs/${run.id}`} className="font-display text-lg hover:text-cheese-gold">
                    {run.name}
                  </Link>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[run.status]}`}>
                    {run.status}
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  {run._count.shows} show{run._count.shows === 1 ? "" : "s"} · {run._count.cards} card
                  {run._count.cards === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/runs/${run.id}`} className="btn-secondary text-xs">
                  Manage
                </Link>
                <RunStatusControls runId={run.id} status={run.status} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
