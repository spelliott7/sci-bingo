"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TYPE_LABEL: Record<string, string> = { BINGO: "Bingo", PICK3: "Pick 3" };

type ActiveGame = {
  id: string;
  type: "BINGO" | "PICK3";
  name: string;
  entryFee: number;
  pot: number;
  playerCount: number;
  hasEntered: boolean;
  shows: { id: string; name: string | null; venue: string | null; showDate: string }[];
};

export default function DashboardGames({ initialGames }: { initialGames: ActiveGame[] }) {
  const [games, setGames] = useState(initialGames);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/games/active");
      if (res.ok) {
        const json = await res.json();
        setGames(json.games);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  if (games.length === 0) {
    return (
      <div className="panel mt-6">
        <p className="text-white/70">
          No games are active right now. Check back once the admin kicks one off, or browse{" "}
          <Link href="/history" className="text-cheese-gold hover:underline">
            past games
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      {games.map((game) => (
        <div key={game.id} className="panel mt-6">
          <div className="flex items-center gap-2">
            <p className="text-sm uppercase tracking-wide text-cheese-teal">
              {TYPE_LABEL[game.type]}
            </p>
          </div>
          <h2 className="mt-1 font-display text-2xl">{game.name}</h2>
          {game.shows.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-sm text-white/50">
              {game.shows.map((show) => (
                <li key={show.id}>
                  {show.name ? `${show.name} — ` : ""}
                  {show.venue ? `${show.venue}, ` : ""}
                  {new Date(show.showDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/50">Shows haven&apos;t been added yet.</p>
          )}
          <p className="mt-2 text-sm">
            Pot so far:{" "}
            <span className="font-semibold text-cheese-gold">${game.pot.toFixed(2)}</span>
            <span className="text-white/40"> ({game.playerCount} in)</span>
          </p>
          <Link
            href={game.type === "BINGO" ? `/play/${game.id}` : `/pick3/${game.id}`}
            className="btn-primary mt-4 inline-block"
          >
            {game.hasEntered ? "View your entry" : `Enter — $${game.entryFee.toFixed(2)}`}
          </Link>
        </div>
      ))}
    </>
  );
}
