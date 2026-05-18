import ProfileEditor from "@/components/ProfileEditor";
import ProfilePosts from "@/components/ProfilePosts";

export default function ProfilePage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>

      <div className="grid md:grid-cols-2 gap-6">
        
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-3">Edit profil</h2>
          <ProfileEditor />
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-3">Textele mele</h2>
          <ProfilePosts />
        </div>

      </div>
    </main>
  );
}