"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PosterBackground from "@/components/PosterBackground";

export default function AdminLoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin");
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
          <h1 className="font-display text-2xl text-cheese-gold">Admin sign in</h1>
          <p className="mt-1 text-sm text-white/70">
            For whoever&apos;s running the board tonight.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="nickname">
                Nickname
              </label>
              <input
                id="nickname"
                className="field"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
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
        </div>
      </main>
    </>
  );
}
