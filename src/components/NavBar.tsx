import Link from "next/link";
import type { SessionPayload } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export default function NavBar({ session }: { session: SessionPayload | null }) {
  return (
    <header className="border-b border-white/10 bg-cheese-ink/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-xl text-cheese-gold">
          SCI Bingo
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          <Link href="/" className="hover:text-cheese-gold">
            Home
          </Link>
          <Link href="/history" className="hover:text-cheese-gold">
            History
          </Link>
          {session?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-cheese-gold">
              Admin
            </Link>
          )}
          {session ? (
            <>
              <span className="text-white/50">Hey, {session.username}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="hover:text-cheese-gold">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
