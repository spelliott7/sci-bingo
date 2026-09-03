"use client";

import { FREE_POSITION } from "@/lib/bingo";
import SongTypeahead, { type SongOption } from "@/components/SongTypeahead";

export type GridSquare = {
  position: number;
  songId: number | null;
  songName?: string | null;
};

type BuildProps = {
  mode: "build";
  songs: SongOption[];
  squares: GridSquare[];
  onChangeSquare: (position: number, songId: number | null) => void;
};

type ViewProps = {
  mode: "view";
  squares: GridSquare[];
  markedPositions: ReadonlySet<number>;
  winningPositions?: ReadonlySet<number>;
};

type Props = BuildProps | ViewProps;

export default function BingoGrid(props: Props) {
  const byPosition = new Map(props.squares.map((s) => [s.position, s]));

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {Array.from({ length: 25 }, (_, position) => {
        const square = byPosition.get(position);
        const isFree = position === FREE_POSITION;

        if (props.mode === "build") {
          const selectedIds = new Set(
            props.squares.filter((s) => s.songId !== null).map((s) => s.songId as number),
          );
          if (square?.songId) selectedIds.delete(square.songId);

          return (
            <div
              key={position}
              className="flex min-h-[92px] flex-col justify-center rounded-lg border border-white/15 bg-white/5 p-1.5"
            >
              {isFree ? (
                <FreeSquare />
              ) : (
                <SongTypeahead
                  songs={props.songs}
                  value={square?.songId ?? null}
                  excludeIds={selectedIds}
                  onChange={(songId) => props.onChangeSquare(position, songId)}
                  placeholder="Song…"
                />
              )}
            </div>
          );
        }

        const marked = isFree || props.markedPositions.has(position);
        const isWinning = props.winningPositions?.has(position) ?? false;

        return (
          <div
            key={position}
            className={`flex min-h-[80px] items-center justify-center rounded-lg border p-1.5 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
              isWinning
                ? "mark-pop border-cheese-gold bg-cheese-gold/30 text-cheese-gold shadow-glow"
                : marked
                  ? "mark-pop border-cheese-teal bg-cheese-teal/25 text-white"
                  : "border-white/15 bg-white/5 text-white/80"
            }`}
          >
            {isFree ? <FreeSquare /> : <span>{square?.songName}</span>}
          </div>
        );
      })}
    </div>
  );
}

function FreeSquare() {
  return (
    <div className="flex flex-col items-center justify-center text-cheese-gold">
      <span className="text-lg">★</span>
      <span className="text-[10px] font-bold uppercase tracking-wide">Free</span>
    </div>
  );
}
