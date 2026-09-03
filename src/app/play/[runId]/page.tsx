import { getSession } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import PlayCardClient from "@/components/PlayCardClient";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const session = await getSession();

  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">Your Bingo Card</h1>
        <div className="panel mt-4">
          <PlayCardClient runId={runId} defaultPlayerName={session?.username ?? ""} />
        </div>
      </main>
    </>
  );
}
