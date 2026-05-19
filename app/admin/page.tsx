"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getAllUsers, updateProfileRole } from "@/lib/postClient";
import type { Profile, UserRole } from "@/lib/types";

type UserWithProfile = {
  id: string;
  email?: string | null;
  profile?: Profile | null;
};

const ROLES: UserRole[] = ["owner", "administrator", "user"];

export default function AdminPage() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = profileData?.role as UserRole | undefined;
      setCurrentRole(role ?? null);

      if (role !== "owner") {
        window.location.href = "/";
        return;
      }

      const profiles = await getAllUsers();

      const { data: usersData } = await supabase.auth.admin.listUsers();

      const usersWithProfiles: UserWithProfile[] = (usersData?.users ?? []).map(
        (u) => ({
          id: u.id,
          email: u.email,
          profile: profiles.find((p) => p.user_id === u.id) ?? null,
        })
      );

      setUsers(usersWithProfiles);
      setLoading(false);
    }

    load();
  }, []);

  async function handleChangeRole(userId: string, newRole: UserRole) {
    setUpdatingId(userId);
    const result = await updateProfileRole(userId, newRole);
    setUpdatingId(null);

    if (result) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, profile: { ...u.profile, role: newRole } as Profile }
            : u
        )
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7efe4] pt-12">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (currentRole !== "owner") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7efe4] pt-12">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.profile?.role ?? "user"}</td>
                  <td className="py-3">
                    <select
                      value={u.profile?.role ?? "user"}
                      onChange={(e) =>
                        handleChangeRole(u.id, e.target.value as UserRole)
                      }
                      disabled={updatingId === u.id}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}