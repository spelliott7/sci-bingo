import { getSession } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import PosterBackground from "@/components/PosterBackground";
import UsersTable from "@/components/UsersTable";

export default async function AdminUsersPage() {
  const session = await getSession();
  return (
    <>
      <PosterBackground />
      <NavBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl text-cheese-gold sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-white/60">
          Everyone who&apos;s registered. Grant admin access here instead of tracking a separate list.
        </p>
        <div className="panel mt-4">
          <UsersTable currentUserId={session!.sub} />
        </div>
      </main>
    </>
  );
}
