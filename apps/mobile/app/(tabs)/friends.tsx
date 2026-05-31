import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function FriendsScreen() {
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const qc = useQueryClient();

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["mobile-friends"],
    queryFn: async () => {
      const { data } = await api.get("/friends");
      return data.data as FriendItem[];
    },
    enabled: tab === "friends",
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["mobile-requests"],
    queryFn: async () => {
      const { data } = await api.get("/friends/requests?direction=received");
      return data.data as FriendRequest[];
    },
    enabled: tab === "requests",
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "reject" }) => {
      await api.patch(`/friends/requests/${id}`, { action });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mobile-requests"] });
      qc.invalidateQueries({ queryKey: ["mobile-friends"] });
    },
  });

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(["friends", "requests"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "friends" ? "Friends" : "Requests"}
              {t === "requests" && requests?.length ? ` (${requests.length})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "friends" && (
        friendsLoading ? (
          <View style={styles.center}><ActivityIndicator color="#ff7c0a" /></View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.friendshipId}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyTitle}>No friends yet</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.friend.username[0]?.toUpperCase()}</Text>
                  {item.friend.isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.friend.username}</Text>
                  {item.friend.city && <Text style={styles.rowSub}>{item.friend.city}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert("Remove", `Remove ${item.friend.username} from friends?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => {} },
                  ])}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      )}

      {tab === "requests" && (
        requestsLoading ? (
          <View style={styles.center}><ActivityIndicator color="#ff7c0a" /></View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>✉️</Text>
                <Text style={styles.emptyTitle}>No pending requests</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.sender.username[0]?.toUpperCase()}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.sender.username}</Text>
                  {item.sender.city && <Text style={styles.rowSub}>{item.sender.city}</Text>}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => respondMutation.mutate({ id: item.id, action: "accept" })}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => respondMutation.mutate({ id: item.id, action: "reject" })}
                  >
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      )}
    </View>
  );
}

interface FriendItem {
  friendshipId: string;
  since: string;
  friend: { id: string; username: string; city?: string | null; isOnline: boolean; avatarUrl?: string | null };
}
interface FriendRequest {
  id: string;
  sender: { id: string; username: string; city?: string | null };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#ff7c0a" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  tabTextActive: { color: "#ff7c0a" },
  list: { padding: 16, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#ff7c0a", alignItems: "center", justifyContent: "center", position: "relative" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  onlineDot: { position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#fff" },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  rowSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 6 },
  acceptBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#ff7c0a", alignItems: "center", justifyContent: "center" },
  rejectBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
});
