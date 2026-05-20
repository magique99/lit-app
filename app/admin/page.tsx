"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  deleteAllPostsAndComments,
  getAllUsers,
  updateProfileRole,
} from "@/lib/postClient";
import { toProfile } from "@/lib/types";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

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

       const profile = toProfile(profileData);
       const role = profile?.role;
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

  async function handleDeleteAllContent() {
    if (
      !window.confirm(
        "Ești sigur că vrei să ștergi toate postările și toate comentariile? Această acțiune este ireversibilă."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteMessage(null);

    const success = await deleteAllPostsAndComments();
    setIsDeleting(false);

    if (success) {
      setDeleteMessage("Toate postările și toate comentariile au fost șterse cu succes.");
    } else {
      setDeleteMessage(
        "A apărut o eroare la ștergerea conținutului. Încearcă din nou sau verifică consola."
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
          <div className="mb-6 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Ștergere conținut</h2>
              <p className="text-sm text-slate-600">
                Buttonul de mai jos va șterge toate postările și toate comentariile.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAllContent}
              disabled={isDeleting}
              className="inline-flex items-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Ștergere în curs..." : "Șterge toate postările și comentariile"}
            </button>
            {deleteMessage ? (
              <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">
                {deleteMessage}
              </p>
            ) : null}
          </div>

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