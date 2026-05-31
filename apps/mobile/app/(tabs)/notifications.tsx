import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@summermate/shared";

const ICONS: Record<string, string> = {
  FRIEND_REQUEST: "👋",
  FRIEND_ACCEPTED: "🤝",
  EVENT_INVITATION: "🎉",
  CHAT_MENTION: "💬",
  NEW_ACTIVITY_NEARBY: "📍",
  ACTIVITY_JOINED: "✅",
  ACTIVITY_CANCELLED: "❌",
};

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data.data as { notifications: Notification[]; unreadCount: number };
    },
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => { await api.patch("/notifications"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobile-notifications"] }),
  });

  return (
    <View style={styles.container}>
      {data?.unreadCount ? (
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAllRead()}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      ) : null}

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color="#ff7c0a" size="large" /></View>
      ) : (
        <FlatList
          data={data?.notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, !item.isRead && styles.rowUnread]}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>{ICONS[item.type] ?? "🔔"}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, !item.isRead && styles.titleBold]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  markAllBtn: { padding: 12, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  markAllText: { color: "#ff7c0a", fontWeight: "600", fontSize: 14 },
  list: { padding: 12, gap: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rowUnread: { backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa" },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  title: { fontSize: 14, color: "#111827" },
  titleBold: { fontWeight: "600" },
  body: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  time: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff7c0a", marginTop: 4 },
});
