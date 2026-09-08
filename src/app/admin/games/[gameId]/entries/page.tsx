import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import EntriesReviewPanel from "@/components/EntriesReviewPanel";

const TYPE_LABEL: Record<string, string> = { BINGO: "Bingo", PICK3: "Pick 3" };

export default async function AdminEntriesPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const session = await getSession();
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) notFound();

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href={`/admin/games/${game.id}`} className="text-sm text-white/50 hover:underline">
          ← Back to {game.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">Entries</h1>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
            {TYPE_LABEL[game.type]}
          </span>
        </div>
        <p className="mt-1 text-sm text-white/60">
          Every card{game.type === "PICK3" ? "/entry" : ""}, scroll sideways to compare — updates
          automatically as songs get marked played.
        </p>

        <div className="mt-6">
          <EntriesReviewPanel gameId={game.id} />
        </div>
      </main>
    </>
  );
}
