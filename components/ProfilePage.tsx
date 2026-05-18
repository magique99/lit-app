import ProfileEditorV2 from "@/components/ProfileEditorV2";
import ProfilePostsV2 from "@/components/profile/ProfilePostsV2";

export default function ProfilePage() {
  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">

      {/* TITLE */}
      <h1 className="text-2xl font-bold">
        Profilul meu
      </h1>

      {/* PROFILE CARD (FULL WIDTH) */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <ProfileEditorV2 />
      </div>

      {/* POSTS SECTION */}
      <div className="space-y-3">

        <h2 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
          Textele mele
        </h2>

        <ProfilePostsV2 />

      </div>

    </main>
  );
}