"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  user_id: string;
  username: string;
  bio: string;
  avatar_url?: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function ProfileV2() {
  const [userId, setUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);

  // form
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  // =====================
  // INIT USER
  // =====================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // =====================
  // LOAD PROFILE + POSTS
  // =====================
  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);

      const [{ data: profileData }, { data: postsData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single(),

          supabase
            .from("posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      setProfile(profileData);
      setPosts(postsData || []);

      setUsername(profileData?.username || "");
      setBio(profileData?.bio || "");

      setLoading(false);
    }

    load();
  }, [userId]);

  // =====================
  // SAVE PROFILE
  // =====================
  async function saveProfile() {
    if (!userId) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        username,
        bio,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Eroare la salvare profil");
      return;
    }

    setProfile(data);
    setEditMode(false);
  }

  // =====================
  // DELETE POST
  // =====================
  async function deletePost(id: string) {
    setPosts((p) => p.filter((x) => x.id !== id));

    await supabase.from("posts").delete().eq("id", id);
  }

  if (!userId) {
    return (
      <div className="p-6">
        Trebuie să fii logat.
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Se încarcă...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* ================= PROFILE CARD ================= */}
      <div className="border rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">
            Profilul meu
          </h1>

          <button
            onClick={() => setEditMode(!editMode)}
            className="text-sm underline"
          >
            {editMode ? "Anulează" : "Editează"}
          </button>
        </div>

        {!editMode ? (
          <div>
            <p className="text-lg font-semibold">
              {profile?.username || "Fără username"}
            </p>

            <p className="text-gray-600 mt-2">
              {profile?.bio || "Fără bio"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full border p-2 rounded"
            />

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio"
              className="w-full border p-2 rounded"
            />

            <button
              onClick={saveProfile}
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded"
            >
              {saving ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        )}
      </div>

      {/* ================= POSTS ================= */}
      <div className="border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">
          Textele mele
        </h2>

        {posts.length === 0 && (
          <p className="text-gray-500">
            Nu ai postări încă.
          </p>
        )}

        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="border rounded p-4"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">
                  {p.title}
                </h3>

                <button
                  onClick={() => deletePost(p.id)}
                  className="text-red-500 text-sm"
                >
                  Șterge
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                {p.content.slice(0, 120)}...
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}