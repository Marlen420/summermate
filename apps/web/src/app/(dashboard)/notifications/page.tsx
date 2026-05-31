"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actorId?: string | null;
  activityId?: string | null;
}

const notificationIcons: Record<string, string> = {
  FRIEND_REQUEST: "👋",
  FRIEND_ACCEPTED: "🤝",
  EVENT_INVITATION: "🎉",
  CHAT_MENTION: "💬",
  NEW_ACTIVITY_NEARBY: "📍",
  ACTIVITY_JOINED: "✅",
  ACTIVITY_CANCELLED: "❌",
};

export default function NotificationsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data as { notifications: Notification[]; unreadCount: number };
    },
    enabled: !!token,
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      await axios.patch("/api/notifications", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {data?.unreadCount ? (
            <p className="text-sm text-muted-foreground">{data.unreadCount} unread</p>
          ) : null}
        </div>
        {data?.unreadCount ? (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
            <BellOff className="w-4 h-4 mr-1.5" />
            Mark all read
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : data?.notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {data?.notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer hover:bg-accent",
                !notif.isRead && "bg-primary/5 border border-primary/10"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                {notificationIcons[notif.type] ?? "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !notif.isRead && "font-semibold")}>
                  {notif.title}
                </p>
                <p className="text-sm text-muted-foreground">{notif.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(notif.createdAt)}
                </p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
