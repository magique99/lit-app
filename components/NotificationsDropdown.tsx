"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  user_id: string;
  actor_id: string;
  type: "like_post" | "like_comment" | "comment" | "reply";
  post_id?: string;
  comment_id?: string;
  read: boolean;
  created_at: string;
  actor?: {
    username?: string;
    avatar_url?: string;
  };
};

export default function NotificationsDropdown({
  userId,
}: {
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // =========================
  // LOAD NOTIFICATIONS
  // =========================
  async function loadNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  }

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    if (!userId) return;
    loadNotifications();
  }, [userId]);

  // =========================
  // REALTIME
  // =========================
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [
            payload.new as Notification,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // =========================
  // MARK AS READ
  // =========================
  async function markAsRead(id: string) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  }

  // =========================
  // UNREAD COUNT
  // =========================
  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  // =========================
  // UI
  // =========================
  return (
    <div className="relative">

      {/* BELL BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="relative text-xl"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-50">

          <div className="p-3 border-b font-semibold text-sm">
            Notifications
          </div>

          <div className="max-h-96 overflow-y-auto">

            {notifications.length === 0 && (
              <div className="p-4 text-sm text-gray-500">
                No notifications yet
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-3 text-sm border-b cursor-pointer hover:bg-gray-50 ${
                  !n.read ? "bg-gray-50" : ""
                }`}
              >

                <div className="flex justify-between items-center">

                  <div>
                    {n.type === "like_post" && "❤️ liked your post"}
                    {n.type === "like_comment" && "❤️ liked your comment"}
                    {n.type === "comment" && "💬 commented on your post"}
                    {n.type === "reply" && "↩️ replied to your comment"}
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}

                </div>

                <div className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </div>

              </div>
            ))}

          </div>
        </div>
      )}

    </div>
  );
}