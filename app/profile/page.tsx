import ProfilePosts from "@/components/ProfilePosts";

export default function ProfilePage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Profilul meu
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* stânga: date profil */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Profil</h2>
          <p>date user aici (username, email etc.)</p>
        </div>

        {/* dreapta: texte */}
        <div>
          <h2 className="font-semibold mb-2">Textele mele</h2>
          <ProfilePosts />
        </div>

      </div>
    </main>
  );
}