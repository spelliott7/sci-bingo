"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PosterBackground from "@/components/PosterBackground";

function GateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [keyword, setKeyword] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-md text-center">
        <h1 className="title-gradient font-display text-3xl sm:text-4xl">SCI Bingo</h1>
        <p className="mt-2 text-white/70">
          This game is just for our crew. Enter the keyword and password to get in.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div>
            <label className="label" htmlFor="keyword">
              Keyword
            </label>
            <input
              id="keyword"
              className="field"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              autoComplete="off"
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
              required
            />
          </div>
          {error && <p className="text-sm text-cheese-pink">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Checking…" : "Let me in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function GatePage() {
  return (
    <>
      <PosterBackground />
      <Suspense fallback={null}>
        <GateForm />
      </Suspense>
    </>
  );
}
