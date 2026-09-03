"use client";

import { useCallback, useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  role: "PLAYER" | "ADMIN";
  createdAt: string;
};

export default function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json();
      setUsers(json.users);
    }
  }, []);

  useEffect(() => {
    // Intentional: fetch the user list on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggleRole(user: User) {
    const nextRole = user.role === "ADMIN" ? "PLAYER" : "ADMIN";
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't update that user.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!users) {
    return <p className="text-white/50">Loading users…</p>;
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-cheese-pink">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-white/50">
            <tr>
              <th className="py-1 pr-2 font-normal">Username</th>
              <th className="py-1 pr-2 font-normal">Email</th>
              <th className="py-1 pr-2 font-normal">Joined</th>
              <th className="py-1 pr-2 font-normal">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="py-2 pr-2 font-semibold">
                  @{u.username}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-cheese-gold">(you)</span>}
                </td>
                <td className="py-2 pr-2 text-white/60">{u.email}</td>
                <td className="py-2 pr-2 text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-2 pr-2">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={busyId === u.id || (u.id === currentUserId && u.role === "ADMIN")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      u.role === "ADMIN"
                        ? "bg-cheese-gold/20 text-cheese-gold"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {u.role === "ADMIN" ? "Admin ✓" : "Make admin"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-white/50">
                  No one has registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
