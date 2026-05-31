"use client";

import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import Link from "next/link";
import { Calendar, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, categoryEmoji, priceLevelLabel } from "@/lib/utils";

const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

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
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function ActivityMap({
  activities,
  isLoading,
  center = { lat: 48.8566, lng: 2.3522 },
  zoom = 12,
}: ActivityMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => setMap(map), []);
  const onUnmount = useCallback(() => setMap(null), []);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-3 text-muted-foreground">
        <MapPin className="w-8 h-8 text-destructive" />
        <p className="text-sm">Failed to load Google Maps.</p>
        <p className="text-xs">Check your API key in <code>.env</code>.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-sm text-muted-foreground animate-pulse">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center}
        zoom={zoom}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={() => setSelectedActivity(null)}
      >
        {activities.map((activity) => (
          <Marker
            key={activity.id}
            position={{ lat: activity.latitude, lng: activity.longitude }}
            label={{
              text: categoryEmoji(activity.category),
              fontSize: "22px",
            }}
            onClick={() => setSelectedActivity(activity)}
          />
        ))}

        {selectedActivity && (
          <InfoWindow
            position={{ lat: selectedActivity.latitude, lng: selectedActivity.longitude }}
            onCloseClick={() => setSelectedActivity(null)}
          >
            <div className="p-1 max-w-[260px]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm leading-tight text-gray-900">
                  {selectedActivity.title}
                </h3>
                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                  {priceLevelLabel(selectedActivity.priceLevel)}
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(selectedActivity.date)}
                </div>
                {selectedActivity.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedActivity.city}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {selectedActivity._count.participants}
                  {selectedActivity.maxParticipants
                    ? ` / ${selectedActivity.maxParticipants}`
                    : ""}{" "}
                  going
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {selectedActivity.description}
              </p>

              <Link href={`/activities/${selectedActivity.id}`}>
                <Button size="sm" className="w-full text-xs h-8">
                  View & Join
                </Button>
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="text-sm text-gray-500 animate-pulse">Loading activities…</div>
        </div>
      )}
    </div>
  );
}
