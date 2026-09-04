"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SongOption = {
  id: number;
  name: string;
};

type Props = {
  songs: SongOption[];
  value: number | null;
  onChange: (songId: number | null) => void;
  excludeIds?: ReadonlySet<number>;
  placeholder?: string;
  disabled?: boolean;
};

const MAX_RESULTS = 40;

const DROPDOWN_WIDTH = 288;
const VIEWPORT_MARGIN = 12;

export default function SongTypeahead({
  songs,
  value,
  onChange,
  excludeIds,
  placeholder = "Type a song…",
  disabled = false,
}: Props) {
  const listboxId = useId();
  const selected = useMemo(() => songs.find((s) => s.id === value) ?? null, [songs, value]);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<{ left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // The song picker often lives in a narrow grid cell (as little as ~70px on
  // a phone), which would otherwise force the dropdown list to that same
  // unusable width. Break it out to a comfortable width, clamped so it
  // never runs off either edge of the viewport. This only touches the
  // horizontal position/width, computed relative to `containerRef` (its own
  // positioned ancestor) — vertical placement stays plain `top-full` CSS, so
  // it moves naturally with the page instead of needing to track scroll or
  // the viewport resize a mobile on-screen keyboard causes.
  function openDropdown() {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const maxWidth = window.innerWidth - VIEWPORT_MARGIN * 2;
      const width = Math.max(rect.width, Math.min(DROPDOWN_WIDTH, maxWidth));
      const viewportLeft = Math.min(
        Math.max(rect.left, VIEWPORT_MARGIN),
        window.innerWidth - width - VIEWPORT_MARGIN,
      );
      setDropdownStyle({ left: viewportLeft - rect.left, width });
    }
    setOpen(true);
  }

  // Keep the visible text in sync with the selected song without an effect:
  // adjust state during render when the externally-controlled `value` changes.
  const [syncedValue, setSyncedValue] = useState(value);
  if (syncedValue !== value) {
    setSyncedValue(value);
    setQuery(selected?.name ?? "");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = songs.filter((s) => s.id === value || !excludeIds?.has(s.id));
    const filtered = q ? available.filter((s) => s.name.toLowerCase().includes(q)) : available;
    return filtered.slice(0, MAX_RESULTS);
  }, [songs, query, excludeIds, value]);

  function selectSong(song: SongOption) {
    onChange(song.id);
    setQuery(song.name);
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setQuery("");
    openDropdown();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const song = results[highlighted];
      if (song) selectSong(song);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected?.name ?? "");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          className="field pr-8 text-sm"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={openDropdown}
          onChange={(e) => {
            setQuery(e.target.value);
            openDropdown();
            setHighlighted(0);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listboxId}
        />
        {selected && !disabled && (
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Clear song"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
          >
            ×
          </button>
        )}
      </div>
      {open && !disabled && dropdownStyle && (
        <ul
          id={listboxId}
          role="listbox"
          style={{ left: dropdownStyle.left, width: dropdownStyle.width }}
          className="absolute top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-white/20 bg-cheese-purple shadow-xl"
        >
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-white/50">No songs match.</li>
          )}
          {results.map((song, i) => (
            <li
              key={song.id}
              role="option"
              aria-selected={song.id === value}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSong(song);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === highlighted ? "bg-cheese-magenta/60" : ""
              } ${song.id === value ? "font-semibold text-cheese-gold" : ""}`}
            >
              {song.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
