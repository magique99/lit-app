import ProfilePageV4 from "@/components/profile/ProfilePageV4";
import ProfilePostsV2 from "@/components/profile/ProfilePostsV2";

export default function ProfilePage() {
  return (
     <main className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <h1 className="text-3xl font-bold mb-8">
        Profilul meu
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        <section className="border rounded-xl p-5">
          <ProfilePageV4 />
        </section>

      </div>
      </div>
    </main>
  );
}