"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Notification } from "@/lib/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD INITIAL NOTIFICATIONS
  // =========================
  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD NOTIFICATIONS ERROR:", error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadNotifications();
    });

    // =========================
    // REALTIME SUBSCRIPTION ⚡
    // =========================
    let removeChannel: (() => void) | undefined;

    (async () => {
      try {
        const channel = supabase
          .channel("notifications-realtime")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
            },
            (payload) => {
              setNotifications((prev) => [
                payload.new as Notification,
                ...prev,
              ]);
            },
          );

        const { error } = await channel.subscribe();
        if (error) {
          console.warn("Notifications realtime subscription error:", error);
          return;
        }

        removeChannel = () => {
          void supabase.removeChannel(channel).catch(() => {});
        };
      } catch (err) {
        console.error("Notifications realtime setup failed:", err);
      }
    })();

    return () => {
      removeChannel?.();
    };
  }, [loadNotifications]);

  // =========================
  // MARK AS READ
  // =========================
  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  }

  return {
    notifications,
    loading,
    markAsRead,
  };
}
