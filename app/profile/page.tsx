import ProfilePageV4 from "@/components/profile/ProfilePageV4";

export default function ProfilePage() {
  return (
    <main className="min-h-screen" style={{ background: "#F7F3EE" }}>
      <div className="max-w-[760px] mx-auto px-6 sm:px-8 pt-16 pb-28">

        <p
          className="text-[11px] uppercase tracking-[0.3em] mb-12"
          style={{ color: "#B87D4B" }}
        >
          Setările contului
        </p>

        <ProfilePageV4 />

      </div>
    </main>
  );
}
