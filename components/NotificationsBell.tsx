"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";

export default function NotificationsBell() {
  const { notifications } = useNotifications();
  const [open, setOpen] = useState(false);

  const unread = notifications.filter(
    (n) => !n.read
  ).length;

  return (
    <div className="relative">

      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="
          relative
          w-9 h-9
          flex items-center justify-center
          rounded-full
          hover:bg-gray-100
          transition
        "
      >
        🔔

        {/* BADGE */}
        {unread > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              bg-red-500 text-white
              text-[10px]
              min-w-[16px] h-[16px]
              flex items-center justify-center
              rounded-full
              px-1
            "
          >
            {unread}
          </span>
        )}
      </button>

      {/* DROPDOWN (Instagram-like preview) */}
      {open && (
        <div
          className="
            absolute right-0 mt-2
            w-72
            bg-white border border-gray-100
            rounded-xl shadow-lg
            overflow-hidden
            z-50
          "
        >

          <div className="p-3 border-b text-sm font-medium">
            Notifications
          </div>

          <div className="max-h-80 overflow-y-auto">

            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className="
                    px-4 py-3
                    text-sm
                    hover:bg-gray-50
                    border-b border-gray-50
                  "
                >
                  <p className="text-gray-800">
                    {n.message}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(
                      n.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}

          </div>

        </div>
      )}
    </div>
  );
}