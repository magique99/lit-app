"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { uploadAvatar } from "@/lib/uploadAvatar";
import { toProfile } from "@/lib/types";
import type { Profile } from "@/lib/types";
import ProfileTabsV4 from "./ProfileTabsV4";
import ProfilePostsV2 from "./ProfilePostsV2";
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<number>(0);
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [vehicle, setVehicle] = useState<string>("");
  const [awards, setAwards] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── LOAD PROFILE ── */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) { setLoading(false); return; }

        // Check if user needs onboarding
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", uid)
          .maybeSingle();

        if (profileError && !profileError?.message?.includes("No rows")) {
          console.error("LOAD PROFILE ERROR:", profileError);
          setError("Nu am putut încărca profilul.");
          setLoading(false);
          return;
        }

        if (!profileData) {
          setLoading(false);
          return;
        }

        // Redirect to onboarding if preferences not set
        if (!profileData.preferences || profileData.preferences.length === 0) {
          router.push("/onboarding");
          return;
        }

        if (profileData) {
          const p = toProfile(profileData)!;
          setProfile(p);
          setUsername(p.username || "");
          setFirstName(p.first_name || "");
          setLastName(p.last_name || "");
          setNickname(p.nickname || "");
          setBio(p.bio || "");
          setGender(p.gender || "");
          setAge(p.age ?? 0);
          setCity(p.city || "");
          setCountry(p.country || "");
          setPhone(p.phone || "");
          setVehicle(p.vehicle || "");
          setAwards(p.awards || "");
          setAvatarUrl(p.avatar_url || "");
        }
        setLoading(false);
      } catch {
        setError("A apărut o eroare.");
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const saveProfile = async () => {
    if (!profile?.user_id) return;
    setSaving(true); setSaveError(null); setSaved(false);

    let finalAvatarUrl = profile.avatar_url;

    if (selectedFile) {
      try {
        const uploaded = await uploadAvatar(selectedFile, profile.user_id);
        if (uploaded) {
          finalAvatarUrl = uploaded;
        } else {
          // fallback base64
          finalAvatarUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
        }
      } catch {
        try {
          finalAvatarUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
        } catch { /* leave existing avatar */ }
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username || null,
        first_name: firstName || null,
        last_name: lastName || null,
        nickname: nickname || null,
        bio: bio || null,
        gender: gender || null,
        age: age > 0 ? age : null,
        city: city || null,
        country: country || null,
        phone: phone || null,
        vehicle: vehicle || null,
        awards: awards || null,
        avatar_url: finalAvatarUrl,
      })
      .eq("user_id", profile.user_id);

    if (error) {
      console.error("SAVE PROFILE ERROR:", error);
      setSaveError("Nu am putut salva profilul.");
      setSaving(false);
      return;
    }

    setProfile(prev => prev ? { ...prev, username, first_name: firstName || null, last_name: lastName || null, nickname: nickname || null, bio: bio || null, gender: gender || null, age: age > 0 ? age : null, city: city || null, country: country || null, phone: phone || null, vehicle: vehicle || null, awards: awards || null, avatar_url: finalAvatarUrl } : null);
    setAvatarUrl(finalAvatarUrl);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-sm">Încărcare…</div>;
  }

  if (error || !profile) {
    return <div className="text-center py-12 text-slate-500 text-sm"><p>{error || "Acest utilizator nu are un profil configurat."}</p></div>;
  }

  return (
    <div className="space-y-8">
      {/* ── SECTION HEADER ── */}
      <h2 className="font-serif text-[28px] sm:text-[32px] leading-tight" style={{ color: "#2A2520" }}>
        @{profile.username}
      </h2>

      {/* ── VIEW: avatar + meta ── */}
      {!edit && (
        <>
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200/80 shrink-0">
              <Image src={avatarUrl || "/user.jpg"} alt="Avatar" fill className="object-cover" />
            </div>
            <div className="text-[13px] text-slate-500 leading-relaxed">
              {profile.bio && <span>{profile.bio}</span>}
              {profile.bio && (profile.city || profile.country) && <span> · </span>}
              <span className="text-slate-400">
                {profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.city || profile.country || null}
              </span>
            </div>
          </div>

          <button
            onClick={() => setEdit(true)}
            className="
              text-[13px] font-medium
              border-b border-slate-300 pb-0.5
              text-slate-600 hover:text-slate-900
              transition-colors self-start
            "
          >
            Editează profilul
          </button>
        </>
      )}

      {/* ── EDIT FORM ── */}
      {edit && (
        <div className="space-y-6">

          {/* avatar upload */}
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200/80 shrink-0 bg-slate-50">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">?</div>
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="
                  text-[13px] font-medium
                  border-b border-slate-300 pb-0.5
                  text-slate-600 hover:text-slate-900
                  transition-colors
                "
              >
                Schimbă fotografia
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatarUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <p className="mt-1 text-[11px] text-slate-400">JPG, PNG sau WebP.</p>
            </div>
          </div>

          {/* form grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Field label="Nume de utilizator" value={username} onChange={setUsername} placeholder="username" />
            <Field label="Nume" value={firstName} onChange={setFirstName} placeholder="Nume" />
            <Field label="Prenume" value={lastName} onChange={setLastName} placeholder="Prenume" />
            <Field label="Pseudonim" value={nickname} onChange={setNickname} placeholder="Pseudonim" />
            <Field label="Oraș" value={city} onChange={setCity} placeholder="Oraș" />
            <Field label="Țară" value={country} onChange={setCountry} placeholder="Țară" />

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Sex</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="
                  w-full rounded-xl border border-slate-200 bg-white
                  px-4 py-3 text-[14px] text-slate-700
                  focus:border-slate-400 focus:outline-none
                "
              >
                <option value="">—</option>
                <option value="masculin">Masculin</option>
                <option value="feminin">Feminin</option>
                <option value="altul">Altul</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Vârsta</label>
              <input
                type="number"
                value={age || ""}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="150"
                className="
                  w-full rounded-xl border border-slate-200 bg-white
                  px-4 py-3 text-[14px] text-slate-700
                  focus:border-slate-400 focus:outline-none
                "
              />
            </div>
          </div>

          {/* bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Despre</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Scrie câteva cuvinte despre tine…"
              className="
                w-full rounded-xl border border-slate-200 bg-white
                px-4 py-3 text-[14px] text-slate-700
                resize-none
                focus:border-slate-400 focus:outline-none
              "
            />
          </div>

          {/* actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => { void saveProfile(); }}
              disabled={saving}
              className="
                text-[13px] font-semibold
                rounded-full px-6 py-2.5
                bg-[#2A2520] text-white
                hover:bg-slate-700
                disabled:opacity-50 disabled:cursor-wait
                transition-colors
              "
            >
              {saving ? "Se salvează…" : saved ? "Salvat ✓" : "Salvează"}
            </button>
            <button
              onClick={() => { setEdit(false); setSaveError(null); setSaved(false); }}
              className="
                text-[13px] text-slate-400
                hover:text-slate-600
                transition-colors
              "
            >
              Anulează
            </button>
          </div>

          {saveError && (
            <p className="text-[12px] text-rose-500">{saveError}</p>
          )}
        </div>
      )}

      {/* ── SEPARATOR ── */}
      <div className="h-px bg-slate-200/70" />

      {/* ── TABS ── */}
      <ProfileTabsV4
        postsSlot={<ProfilePostsV2 />}
        profile={profile}
        loading={loading}
        error={error}
      />
    </div>
  );
}

/* ── SIMPLE FIELD ── */
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full rounded-xl border border-slate-200 bg-white
          px-4 py-3 text-[14px] text-slate-700
          placeholder:text-slate-300
          focus:border-slate-400 focus:outline-none
        "
      />
    </div>
  );
}
