"use client";

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsBell() {
  const { notifications } = useNotifications();

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative cursor-pointer">
      🔔

      {unread > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
          {unread}
        </span>
      )}
    </div>
  );
}