import ProfileEditorV2 from "@/components/ProfileEditorV2";
import ProfilePostsV2 from "@/components/ProfilePostsV2";

export default function ProfilePage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>

      <div className="grid md:grid-cols-2 gap-6">

        {/* LEFT - PROFILE */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-3">Profil</h2>
          <ProfileEditorV2 />
        </div>

        {/* RIGHT - POSTS */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-3">Textele mele</h2>
          <ProfilePostsV2 />
        </div>

      </div>
    </main>
  );
}