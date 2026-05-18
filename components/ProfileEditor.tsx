"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileEditor() {
  const [userId, setUserId] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(false);

  // =========================
  // LOAD USER + PROFILE
  // =========================
  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();

      const id = auth.user?.id || null;
      setUserId(id);

      if (!id) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .single();

      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
    }

    init();
  }, []);

  // =========================
  // SAVE PROFILE
  // =========================
  async function saveProfile() {
    if (!userId) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        username,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Eroare la salvare profil");
      return;
    }

    alert("Profil salvat ✅");
  }

  // =========================
  // UPLOAD AVATAR
  // =========================
  async function uploadAvatar(file: File) {
    if (!userId) return;

    const path = `${userId}/avatar-${Date.now()}.${file.name.split(".").pop()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error(error);
      alert("Upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    setAvatarUrl(data.publicUrl);
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">

      <h1 className="text-2xl font-bold">Profilul meu</h1>

      {/* AVATAR */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
          {avatarUrl && (
            <img src={avatarUrl} className="w-full h-full object-cover" />
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar(file);
          }}
        />
      </div>

      {/* USERNAME */}
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        className="w-full border p-2 rounded"
      />

      {/* BIO */}
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="bio"
        className="w-full border p-2 rounded h-24"
      />

      {/* SAVE */}
      <button
        onClick={saveProfile}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Se salvează..." : "Salvează profil"}
      </button>
    </div>
  );
}