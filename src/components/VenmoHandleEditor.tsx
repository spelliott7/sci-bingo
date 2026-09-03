"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VenmoHandleEditor({
  gameId,
  venmoHandle,
}: {
  gameId: string;
  venmoHandle: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(venmoHandle ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venmoHandle: value.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't save.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <p className="text-sm text-white/60">
        Venmo: {venmoHandle ? <span className="text-white">@{venmoHandle}</span> : <span className="text-white/40">not set</span>}{" "}
        <button onClick={() => setEditing(true)} className="ml-1 text-cheese-gold hover:underline">
          {venmoHandle ? "edit" : "add"}
        </button>
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="field w-48 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="@your-venmo-name"
        autoFocus
      />
      <button onClick={save} disabled={saving} className="btn-primary text-xs">
        {saving ? "Saving…" : "Save"}
      </button>
      <button onClick={() => setEditing(false)} disabled={saving} className="btn-secondary text-xs">
        Cancel
      </button>
      {error && <span className="text-xs text-cheese-pink">{error}</span>}
    </div>
  );
}
