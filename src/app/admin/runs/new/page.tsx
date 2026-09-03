import { getSession } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import NewRunForm from "@/components/NewRunForm";

export default async function NewRunPage() {
  const session = await getSession();
  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-display text-2xl text-cheese-gold">New run</h1>
        <div className="panel mt-4">
          <NewRunForm />
        </div>
      </main>
    </>
  );
}
