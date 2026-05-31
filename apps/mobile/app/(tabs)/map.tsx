import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Activity } from "@summermate/api-types";
import { categoryEmoji } from "@summermate/shared";
import { Link } from "expo-router";
import { useEffect, useRef } from "react";
import * as Location from "expo-location";

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);

  const { data } = useQuery({
    queryKey: ["activities-map"],
    queryFn: async () => {
      const { data } = await api.get("/activities?limit=100");
      return data.data.activities as Activity[];
    },
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {data?.map((activity) => (
          <Marker
            key={activity.id}
            coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
            title={activity.title}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerEmoji}>{categoryEmoji(activity.category)}</Text>
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={2}>{activity.title}</Text>
                <Text style={styles.calloutMeta}>{activity._count?.participants ?? 0} going</Text>
                <Link href={`/activity/${activity.id}`} asChild>
                  <TouchableOpacity style={styles.calloutButton}>
                    <Text style={styles.calloutButtonText}>View →</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#ff7c0a",
  },
  markerEmoji: { fontSize: 24 },
  callout: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  calloutTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 4 },
  calloutMeta: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  calloutButton: {
    backgroundColor: "#ff7c0a",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  calloutButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
