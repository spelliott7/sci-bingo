"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PosterBackground from "@/components/PosterBackground";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PosterBackground />
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="panel w-full max-w-md">
          <h1 className="font-display text-2xl text-cheese-gold">Welcome back</h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="identifier">
                Username or email
              </label>
              <input
                id="identifier"
                className="field"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-cheese-pink">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-white/60">
            New here?{" "}
            <Link href="/register" className="text-cheese-gold hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-white/40">
            Running the game tonight?{" "}
            <Link href="/admin/login" className="text-white/60 hover:underline">
              Admin sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
