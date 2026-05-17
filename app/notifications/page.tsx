import { supabase } from "@/lib/supabaseClient";

export default async function NotificationsPage() {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Notifications
      </h1>

      <div className="space-y-3">
        {data?.map((n) => (
          <div key={n.id} className="p-3 border rounded-xl">
            {n.type === "like_post" && "❤️ someone liked your post"}
            {n.type === "comment" && "💬 someone commented"}
            {n.type === "like_comment" && "❤️ someone liked your comment"}
          </div>
        ))}
      </div>
    </div>
  );
}