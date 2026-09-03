import { getSession } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import NewGameForm from "@/components/NewGameForm";

export default async function NewGamePage() {
  const session = await getSession();
  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-display text-2xl text-cheese-gold">New game</h1>
        <div className="panel mt-4">
          <NewGameForm />
        </div>
      </main>
    </>
  );
}
