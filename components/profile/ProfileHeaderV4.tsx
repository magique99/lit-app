"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadAvatar } from "@/lib/uploadAvatar";
import type { Profile } from "@/lib/types";
import { toProfile } from "@/lib/types";

export default function ProfileHeaderV4() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [edit, setEdit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("LOAD PROFILE ERROR:", error);
          setLoadError("Nu am putut încărca profilul.");
          return;
        }

        setProfile(toProfile(data));
      });
  }, [userId]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

       {/* COVER (Instagram-like small banner) */}
       <div className="h-20 sm:h-24 bg-gradient-to-r from-gray-900 to-gray-600" />

       {/* CONTENT */}
       <div className="px-4 sm:px-6 pb-5 pt-4">

          {/* AVATAR + INFO */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {!edit ? (
              {/* AVATAR (only show in view mode) */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shrink-0">
                <Image
                  src={profile.avatar_url ?? "/user.jpg"}
                  alt={profile.username || "Avatar"}
                  fill
                  sizes="(min-width: 640px) 96px, 80px"
                  className="object-cover"
                />
              </div>
            ) : null}
            
            {/* INFO */}
            <div className="flex-1 text-center sm:text-left">

        {!edit ? (
            <>
                <h2 className="text-xl sm:text-2xl font-bold">
                    @{profile.username}
                </h2>

                <div className="text-sm text-slate-600 mt-1">
                    {profile.first_name && profile.last_name && (
                        <span className="text-slate-700">
                            {profile.first_name} {profile.last_name}
                        </span>
                    )}
                    {!profile.first_name && !profile.last_name && profile.nickname && (
                        <span className="text-slate-700">
                            "{profile.nickname}"
                        </span>
                    )}
                </div>

                <button
                    onClick={() => setEdit(true)}
                    className="
                      mt-3 sm:mt-4
                      w-full sm:w-auto
                      px-4 py-2
                      rounded-xl border
                      text-sm
                      hover:bg-gray-50
                      transition
                    "
                >
                    Edit profile
                </button>
            </>
        ) : (
            <ProfileEditorInline
                profile={profile}
                onClose={() => setEdit(false)}
                onSaved={setProfile}
            />
        )}

          </div>
        </div>

      </div>
    </div>
  );
}

function ProfileEditorInline({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [username, setUsername] =
    useState(profile.username || "");
  const [firstName, setFirstName] =
    useState(profile.first_name ?? "");
  const [lastName, setLastName] =
    useState(profile.last_name ?? "");
  const [nickname, setNickname] =
    useState(profile.nickname ?? "");
  const [bio, setBio] =
    useState(profile.bio || "");
  const [gender, setGender] =
    useState(profile.gender ?? "");
  const [age, setAge] =
    useState(profile.age ?? 0);
  const [city, setCity] =
    useState(profile.city ?? "");
  const [country, setCountry] =
    useState(profile.country ?? "");
  const [phone, setPhone] =
    useState(profile.phone ?? "");
  const [vehicle, setVehicle] =
    useState(profile.vehicle ?? "");
  const [awards, setAwards] =
    useState(profile.awards ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

async function save() {
      if (!profile.user_id) return;

      setSaving(true);
      setError(null);
      setSaved(false);

      let finalAvatarUrl = profile.avatar_url;
      let avatarError = null;

      if (selectedFile && profile.user_id) {
        try {
          const uploadedUrl = await uploadAvatar(selectedFile, profile.user_id);
          if (uploadedUrl) {
            finalAvatarUrl = uploadedUrl;
          } else {
            // Fallback to base64 if storage upload fails
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(selectedFile);
            });
            finalAvatarUrl = await base64Promise;
          }
        } catch (uploadError) {
          console.error("AVATAR UPLOAD ERROR:", uploadError);
          // Try base64 fallback on any error
          try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(selectedFile);
            });
            finalAvatarUrl = await base64Promise;
          } catch (fallbackError) {
            console.error("BASE64 FALLBACK ERROR:", fallbackError);
            avatarError = "Nu am putut încărca avatarul. Verificați conexiunea și încercă din nou.";
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          first_name: firstName || null,
          last_name: lastName || null,
          nickname: nickname || null,
          bio,
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
        setError("Nu am putut salva profilul.");
        setSaving(false);
        return;
      }

      onSaved({
        ...profile,
        username,
        first_name: firstName || null,
        last_name: lastName || null,
        nickname: nickname || null,
        bio,
        gender: gender || null,
        age: age > 0 ? age : null,
        city: city || null,
        country: country || null,
        phone: phone || null,
        vehicle: vehicle || null,
        awards: awards || null,
        avatar_url: finalAvatarUrl,
      });
      setSaving(false);
      setSaved(true);
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
<div className="shrink-0">
               <div className="relative w-24 h-24 rounded-full border-2 border-slate-200 bg-slate-100 overflow-hidden group">
                 {avatarUrl ? (
                   <Image
                     src={avatarUrl}
                     alt="Avatar"
                     fill
                     className="object-cover"
                   />
                 ) : (
                   <Image
                     src="/user.jpg"
                     alt="Default avatar"
                     fill
                     className="object-cover"
                   />
                 )}
                 <label
                   className="absolute inset-0 flex h-full w-full items-center justify-center bg-white/80 rounded-full text-xs font-medium text-slate-700 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                 >
                   Schimbă
                 </label>
                 <input
                   type="file"
                   accept="image/*"
                   className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       setSelectedFile(file);
                       const reader = new FileReader();
                       reader.onloadend = () => {
                         setAvatarUrl(reader.result as string);
                       };
                       reader.readAsDataURL(file);
                     }
                   }}
                 />
               </div>
             </div>
          <div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="username"
                />
                <input
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Nume"
                />
                <input
                  value={lastName}
                  onChange={(e) =>
                    setLastName(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Prenume"
                />
                <input
                  value={nickname}
                  onChange={(e) =>
                    setNickname(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Pseudonim"
                />
                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                >
                  <option value="">Sex (alegere)</option>
                  <option value="masculin">Masculin</option>
                  <option value="feminin">Feminin</option>
                  <option value="altul">Altul</option>
                </select>
                <input
                  type="number"
                  value={age}
                  onChange={(e) =>
                    setAge(parseInt(e.target.value) || 0)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Varsta"
                  min="0"
                  max="150"
                />
                <input
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Oras"
                />
                <input
                  value={country}
                  onChange={(e) =>
                    setCountry(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Tara"
                />
                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Telefon"
                />
                <input
                  value={vehicle}
                  onChange={(e) =>
                    setVehicle(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Moto"
                />
                <input
                  value={awards}
                  onChange={(e) =>
                    setAwards(e.target.value)
                  }
                  className="
                    w-full border rounded-xl p-3 text-sm
                  "
                  placeholder="Premii"
                />
              </div>

              <textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                className="
                  w-full border rounded-xl p-3 text-sm min-h-[100px]
                "
                placeholder="Descriere"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">

          <button
            onClick={() => void save()}
            disabled={saving}
            className="
              bg-black text-white
              px-4 py-2 rounded-xl
              text-sm
              disabled:cursor-wait
              disabled:opacity-60
            "
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={onClose}
            disabled={saving}
            className="
              text-gray-500 text-sm
              disabled:cursor-wait
              disabled:opacity-60
            "
          >
            Cancel
          </button>

        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
            Saved
          </div>
        )}
      </div>
  );
}
