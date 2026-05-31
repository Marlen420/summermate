"use client";

import dynamic from "next/dynamic";
import { useActivities } from "@/hooks/use-activities";
import { Loader2 } from "lucide-react";

// Google Maps SDK must be loaded client-side only
const ActivityMap = dynamic(() => import("@/components/map/ActivityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)] rounded-2xl bg-muted">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { data, isLoading } = useActivities({ limit: 100 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Activity Map</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Explore activities near you
        </p>
      </div>

      <div className="h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-border shadow-md">
        <ActivityMap
          activities={data?.activities ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
