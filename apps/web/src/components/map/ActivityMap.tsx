"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Calendar, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, categoryEmoji, priceLevelLabel } from "@/lib/utils";
import type L from "leaflet";

// Icons are patched inside useEffect to avoid HMR / SSR issues
let leafletIconsPatched = false;

function patchLeafletIcons(L: typeof import("leaflet")) {
  if (leafletIconsPatched) return;
  leafletIconsPatched = true;
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function createActivityIcon(L: typeof import("leaflet"), category: string) {
  const emoji = categoryEmoji(category);
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border-2 border-orange-500 text-xl cursor-pointer hover:scale-110 transition-transform">
        ${emoji}
      </div>
    `,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  mood: string;
  date: string;
  city?: string | null;
  priceLevel: string;
  latitude: number;
  longitude: number;
  creator: { id: string; username: string; avatarUrl?: string | null };
  _count: { participants: number };
  maxParticipants?: number | null;
}

interface ActivityMapProps {
  activities: Activity[];
  isLoading?: boolean;
  center?: [number, number];
  zoom?: number;
}

function UserLocationButton() {
  const map = useMap();

  const goToLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, {
        animate: true,
        duration: 1.5,
      });
    });
  };

  return (
    <button
      onClick={goToLocation}
      className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border p-2.5 hover:bg-accent transition-colors"
      title="Go to my location"
    >
      <MapPin className="w-5 h-5 text-primary" />
    </button>
  );
}

export default function ActivityMap({
  activities,
  isLoading,
  center = [48.8566, 2.3522],
  zoom = 12,
}: ActivityMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    // Dynamically import Leaflet so icons can be patched after the module loads
    import("leaflet").then((mod) => {
      patchLeafletIcons(mod.default);
      setL(mod.default);
      setMounted(true);
    });
    // Returning false-setter ensures MapContainer is removed from the DOM
    // before a potential remount (React 18 StrictMode / HMR), preventing
    // the "Map container is already initialized" Leaflet error.
    return () => setMounted(false);
  }, []);

  if (!mounted || !L) return null;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activities.map((activity) => (
          <Marker
            key={activity.id}
            position={[activity.latitude, activity.longitude]}
            icon={createActivityIcon(L, activity.category)}
            eventHandlers={{
              click: () => setSelectedActivity(activity),
            }}
          >
            <Popup maxWidth={280} className="activity-popup">
              <div className="p-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm leading-tight">{activity.title}</h3>
                  <Badge variant="default" className="text-xs shrink-0">
                    {priceLevelLabel(activity.priceLevel)}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(activity.date)}
                  </div>
                  {activity.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.city}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {activity._count.participants}
                    {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ""} going
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {activity.description}
                </p>

                <Link href={`/activities/${activity.id}`}>
                  <Button size="sm" className="w-full text-xs h-8">
                    View & Join
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        <UserLocationButton />
      </MapContainer>

      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-[999]">
          <div className="text-sm text-muted-foreground">Loading activities...</div>
        </div>
      )}
    </div>
  );
}
