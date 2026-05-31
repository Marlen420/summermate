import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "expo-router";
import { categoryEmoji, moodEmoji, formatDate, priceLevelLabel } from "@summermate/shared";
import type { Activity } from "@summermate/api-types";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const MOODS = ["ADVENTUROUS", "RELAXED", "SOCIAL", "CREATIVE", "ACTIVE", "ROMANTIC", "FAMILY", "SOLO"] as const;

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <Link href={`/activity/${activity.id}`} asChild>
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        {/* Category banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>{categoryEmoji(activity.category)}</Text>
          <View style={styles.bannerBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activity.category}</Text>
            </View>
            <View style={[styles.badge, styles.priceBadge]}>
              <Text style={styles.priceBadgeText}>{priceLevelLabel(activity.priceLevel)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{activity.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{activity.description}</Text>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color="#ff7c0a" />
              <Text style={styles.metaText}>{formatDate(activity.date)}</Text>
            </View>
            {activity.city && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color="#ff7c0a" />
                <Text style={styles.metaText}>{activity.city}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color="#ff7c0a" />
              <Text style={styles.metaText}>
                {activity._count?.participants ?? 0}
                {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ""} going
              </Text>
            </View>
          </View>

          {/* Creator */}
          <View style={styles.creator}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {activity.creator.username[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.creatorName}>by {activity.creator.username}</Text>
            <Text style={styles.moodEmoji}>{moodEmoji(activity.mood)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export default function FeedScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["activities", selectedMood],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20", sort: "date" });
      if (selectedMood) params.set("mood", selectedMood);
      const { data } = await api.get(`/activities?${params}`);
      return data.data as { activities: Activity[] };
    },
  });

  return (
    <View style={styles.container}>
      {/* Mood filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
        <TouchableOpacity
          style={[styles.moodChip, !selectedMood && styles.moodChipActive]}
          onPress={() => setSelectedMood(null)}
        >
          <Text style={[styles.moodChipText, !selectedMood && styles.moodChipTextActive]}>
            ⚡ All Vibes
          </Text>
        </TouchableOpacity>
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[styles.moodChip, selectedMood === mood && styles.moodChipActive]}
            onPress={() => setSelectedMood(selectedMood === mood ? null : mood)}
          >
            <Text style={[styles.moodChipText, selectedMood === mood && styles.moodChipTextActive]}>
              {moodEmoji(mood)} {mood.charAt(0) + mood.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff7c0a" />
        </View>
      ) : (
        <FlatList
          data={data?.activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityItem activity={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ff7c0a" />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🏖️</Text>
              <Text style={styles.emptyTitle}>No activities found</Text>
              <Text style={styles.emptySubtitle}>Try a different vibe!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  moodScroll: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", maxHeight: 56 },
  moodChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f1f5f9", marginRight: 8, alignItems: "center", justifyContent: "center" },
  moodChipActive: { backgroundColor: "#ff7c0a" },
  moodChipText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  moodChipTextActive: { color: "#fff" },
  list: { padding: 16, gap: 14 },
  card: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  banner: { height: 100, backgroundColor: "#ff7c0a", alignItems: "center", justifyContent: "center", position: "relative" },
  bannerEmoji: { fontSize: 42 },
  bannerBadges: { position: "absolute", top: 10, left: 12, right: 12, flexDirection: "row", gap: 6 },
  badge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  priceBadge: { backgroundColor: "rgba(0,0,0,0.2)" },
  priceBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  cardBody: { padding: 14, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardDesc: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  cardMeta: { gap: 4, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#6b7280" },
  creator: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#ff7c0a", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  creatorName: { fontSize: 12, color: "#6b7280", flex: 1 },
  moodEmoji: { fontSize: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
});
