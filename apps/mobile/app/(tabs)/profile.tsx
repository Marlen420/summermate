import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import type { UserProfile } from "@summermate/api-types";

interface ProfileData extends UserProfile {
  interests: Array<{ interest: { id: string; name: string; icon?: string | null } }>;
  _count: { friendshipsA: number; friendshipsB: number; participations: number };
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-mobile"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data.data as ProfileData;
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff7c0a" size="large" />
      </View>
    );
  }

  const friendCount = (profile?._count.friendshipsA ?? 0) + (profile?._count.friendshipsB ?? 0);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView>
        {/* Cover */}
        <View style={styles.cover} />

        <View style={styles.content}>
          {/* Avatar + actions */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {profile?.username[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.editBtn}>
                <Ionicons name="pencil" size={16} color="#374151" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <Text style={styles.username}>{profile?.username}</Text>
          {profile?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#9ca3af" />
              <Text style={styles.location}>{profile.city}</Text>
            </View>
          )}
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <Text style={styles.joinDate}>
            Joined {profile?.createdAt ? format(new Date(profile.createdAt), "MMMM yyyy") : ""}
          </Text>

          {/* Stats */}
          <View style={styles.stats}>
            {[
              { label: "Friends", value: friendCount },
              { label: "Activities", value: profile?._count.participations ?? 0 },
            ].map(({ label, value }) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Interests */}
          {profile?.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestWrap}>
                {profile.interests.map(({ interest }) => (
                  <View key={interest.id} style={styles.interestChip}>
                    <Text style={styles.interestText}>
                      {interest.icon ?? "🎯"} {interest.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cover: { height: 120, backgroundColor: "#ff7c0a" },
  content: { padding: 16, marginTop: -40 },
  avatarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  avatarWrapper: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#fff", overflow: "hidden" },
  avatar: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarFallback: { backgroundColor: "#ff7c0a", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 28, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  editBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  logoutBtn: { padding: 8, borderRadius: 12, borderWidth: 1, borderColor: "#fee2e2", backgroundColor: "#fef2f2" },
  username: { fontSize: 22, fontWeight: "700", color: "#111827" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  location: { fontSize: 13, color: "#9ca3af" },
  bio: { fontSize: 14, color: "#374151", marginTop: 8, lineHeight: 20 },
  joinDate: { fontSize: 12, color: "#9ca3af", marginTop: 6 },
  stats: { flexDirection: "row", gap: 32, marginTop: 16, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  stat: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  interestWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: { backgroundColor: "#fff7ed", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#fed7aa" },
  interestText: { fontSize: 13, color: "#c2410c", fontWeight: "500" },
});
