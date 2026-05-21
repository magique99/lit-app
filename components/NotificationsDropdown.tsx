"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Notification as NotificationRow } from "@/lib/types";

type Notification = NotificationRow & {
  actor?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export default function NotificationsDropdown({
  userId,
}: {
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // LOAD
  useEffect(() => {
    if (!userId) return;

    async function load() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("LOAD NOTIFICATIONS ERROR:", error);
        return;
      }

      const notificationsData = data || [];
      const actorIds = Array.from(
        new Set(
          notificationsData
            .map((item) => item.actor_id)
            .filter(Boolean) as string[]
        )
      );

      let actorMap: Record<string, { username: string | null; avatar_url: string | null }> = {};

      if (actorIds.length > 0) {
        const { data: actorsData, error: actorsError } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", actorIds);

        if (!actorsError && actorsData) {
          actorMap = actorsData.reduce(
            (map, actor) => ({
              ...map,
              [actor.user_id]: {
                username: actor.username,
                avatar_url: actor.avatar_url,
              },
            }),
            {}
          );
        }
      }

      setNotifications(
        notificationsData.map((notification) => ({
          ...notification,
          actor: notification.actor_id
            ? actorMap[notification.actor_id] ?? null
            : null,
        }))
      );
    }

    load();
  }, [userId]);

  // REALTIME
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
        async (payload) => {
          const newNotification = payload.new as NotificationRow;
          
          let actorData = null;
          if (newNotification.actor_id) {
            const { data: actorResult } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("user_id", newNotification.actor_id)
              .single();
            if (actorResult) {
              actorData = {
                username: actorResult.username,
                avatar_url: actorResult.avatar_url,
              };
            }
          }

          setNotifications((prev) => [
            { ...newNotification, actor: actorData },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        open &&
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("touchstart", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>

      {/* BELL */}
      <button
        onClick={() => setOpen(!open)}
        className="
          relative w-9 h-9
          flex items-center justify-center
          rounded-full bg-[#f5ece1]
          hover:bg-[#fff4e5]
          transition
        "
      >
        🔔

        {unread > 0 && (
          <span className="
            absolute -top-1 -right-1
            bg-red-500 text-white
            text-[10px]
            min-w-[16px] h-[16px]
            flex items-center justify-center
            rounded-full
          ">
            {unread}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="
          absolute right-0 mt-2
          w-80 sm:w-96
          bg-white
          border border-slate-200
          rounded-xl
          shadow-[0_20px_80px_rgba(15,23,42,0.08)]
          overflow-hidden
          z-50
        ">

          {/* HEADER */}
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-700">
            Notifications
          </div>

          {/* LIST */}
          <div className="max-h-96 overflow-y-auto">

            {notifications.length === 0 && (
              <div className="p-4 text-sm text-slate-500">
                No notifications yet
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`
                  flex items-start gap-3
                  px-4 py-3
                  cursor-pointer
                  transition
                  ${!n.read ? "bg-[#fff7ec]" : ""}
                `}
              >

                {/* AVATAR */}
                <div className="relative w-9 h-9 rounded-full bg-[#f5ece1] overflow-hidden shrink-0">
                  <Image
                    src={n.actor?.avatar_url ?? "/user.jpg"}
                    alt={n.actor?.username || "Avatar"}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>

                {/* TEXT */}
                <div className="flex-1">

                  <div className="text-sm text-slate-800 leading-snug">
                    <span className="font-medium">
                      {n.actor?.username || "Someone"}
                    </span>{" "}

                    {n.type === "like_post" && "liked your post ❤️"}
                    {n.type === "like_comment" && "liked your comment ❤️"}
                    {n.type === "comment" && "commented on your post 💬"}
                    {n.type === "reply" && "replied to your comment ↩️"}
                  </div>

                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>

                </div>

                {/* UNREAD DOT */}
                {!n.read && (
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2" />
                )}

              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
}
