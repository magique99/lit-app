import ProfileHeaderV4 from "@/components/profile/ProfileHeaderV4";
import ProfileTabsV4 from "@/components/profile/ProfileTabsV4";
import ProfilePostsV2 from "@/components/profile/ProfilePostsV2";

export default function ProfilePage() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">

      <ProfileHeaderV4 />

      <ProfileTabsV4
        postsSlot={<ProfilePostsV2 />}
      />

    </main>
  );
}