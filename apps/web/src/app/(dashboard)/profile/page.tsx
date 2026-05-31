"use client";

import { useAuthStore } from "@/stores/auth";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { MapPin, Calendar, Users, Edit3, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categoryEmoji } from "@/lib/utils";
import { format } from "date-fns";

interface ProfileData {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  createdAt: string;
  interests: Array<{ interest: { id: string; name: string; icon?: string | null } }>;
  _count: { friendshipsA: number; friendshipsB: number; participations: number };
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data as ProfileData;
    },
    enabled: !!token,
  });

  const { data: history } = useQuery({
    queryKey: ["activity-history", user?.id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/activities?creatorId=${user?.id}&limit=6`);
      return data.data.activities;
    },
    enabled: !!user?.id,
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const friendCount = (profile?._count.friendshipsA ?? 0) + (profile?._count.friendshipsB ?? 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-28 gradient-hero" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar className="w-24 h-24 border-4 border-card shadow-xl">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <h1 className="text-xl font-bold">{profile?.username}</h1>

          {profile?.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.city}
            </p>
          )}

          {profile?.bio && (
            <p className="text-sm mt-3 leading-relaxed">{profile.bio}</p>
          )}

          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            <Calendar className="w-3 h-3" />
            Joined {profile?.createdAt ? format(new Date(profile.createdAt), "MMMM yyyy") : ""}
          </p>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-border">
            {[
              { label: "Friends", value: friendCount },
              { label: "Activities", value: profile?._count.participations ?? 0 },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interests */}
      {profile?.interests && profile.interests.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map(({ interest }) => (
              <Badge key={interest.id} variant="secondary" className="gap-1">
                {interest.icon ?? categoryEmoji(interest.name.toUpperCase())}
                {interest.name}
              </Badge>
            ))}
          </div>
          <Link href="/profile/interests" className="mt-3 block">
            <Button variant="ghost" size="sm">Edit interests</Button>
          </Link>
        </div>
      )}

      {/* Recent activities */}
      {history && history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">My Activities</h2>
            <Link href="/activities" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.map((a: Parameters<typeof ActivityCard>[0]["activity"]) => (
              <ActivityCard key={a.id} activity={a} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
