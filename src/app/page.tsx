import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";

export default async function DashboardPage() {
  const session = await getSession();

  const activeRun = await prisma.run.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  const [myCard, shows] = activeRun
    ? await Promise.all([
        prisma.bingoCard.findUnique({
          where: { runId_userId: { runId: activeRun.id, userId: session!.sub } },
        }),
        prisma.show.findMany({ where: { runId: activeRun.id }, orderBy: { showDate: "asc" } }),
      ])
    : [null, []];

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl text-cheese-gold sm:text-4xl">
          Hey {session?.username} 👋
        </h1>

        {activeRun ? (
          <div className="panel mt-6">
            <p className="text-sm uppercase tracking-wide text-cheese-teal">This run</p>
            <h2 className="mt-1 font-display text-2xl">{activeRun.name}</h2>
            {shows.length > 0 ? (
              <ul className="mt-2 space-y-0.5 text-sm text-white/50">
                {shows.map((show) => (
                  <li key={show.id}>
                    {show.name ? `${show.name} — ` : ""}
                    {show.venue ? `${show.venue}, ` : ""}
                    {new Date(show.showDate).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-white/50">Shows for this run haven&apos;t been added yet.</p>
            )}
            <Link href={`/play/${activeRun.id}`} className="btn-primary mt-4 inline-block">
              {myCard ? "View your card" : `Build your card — $${Number(activeRun.entryFee).toFixed(2)}`}
            </Link>
          </div>
        ) : (
          <div className="panel mt-6">
            <p className="text-white/70">
              No game is active right now. Check back once the admin kicks one off, or browse{" "}
              <Link href="/history" className="text-cheese-gold hover:underline">
                past runs
              </Link>
              .
            </p>
          </div>
        )}
      </main>
    </>
  );
}
