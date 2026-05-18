import ProfileCardV3 from "@/components/ProfileCardV3";
import ProfilePostsV2 from "@/components/ProfilePostsV2";

export default function ProfilePage() {
  return (
    <main className="max-w-5xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-8">
        Profilul meu
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        {/* LEFT */}
        <section className="border rounded-xl p-5">
          <ProfileCardV3 />
        </section>

        {/* RIGHT */}
        <section className="border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">
            Textele mele
          </h2>

          <ProfilePostsV2 />
        </section>

      </div>

    </main>
  );
}