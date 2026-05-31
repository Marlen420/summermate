"use client";

import { useParams, useRouter } from "next/navigation";
import { useActivity, useJoinActivity, useLeaveActivity } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  MapPin,
  Users,
  Star,
  MessageCircle,
  Camera,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Share2,
} from "lucide-react";
import { formatDate, categoryEmoji, moodEmoji, priceLevelLabel } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import Link from "next/link";
import dynamic from "next/dynamic";

const ActivityMap = dynamic(() => import("@/components/map/ActivityMap"), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-muted animate-pulse" />,
});

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: activity, isLoading, isError } = useActivity(id);
  const { mutate: joinActivity, isPending: joining } = useJoinActivity();
  const { mutate: leaveActivity, isPending: leaving } = useLeaveActivity();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !activity) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-5xl">😕</p>
        <h2 className="text-xl font-bold">Activity not found</h2>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const isParticipant = activity.participants.some((p) => p.user.id === user?.id);
  const isCreator = activity.creatorId === user?.id;
  const isFull =
    activity.maxParticipants !== null &&
    activity.participants.length >= (activity.maxParticipants ?? Infinity);

  const avgRating =
    activity.ratings.length > 0
      ? (
          activity.ratings.reduce(
            (s, r) => s + (r.activityScore + r.organizationScore + r.funScore) / 3,
            0
          ) / activity.ratings.length
        ).toFixed(1)
      : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Cover */}
      <div className="relative h-64 rounded-2xl overflow-hidden">
        {activity.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activity.photos[0].url}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-summer flex items-center justify-center">
            <span className="text-8xl">{categoryEmoji(activity.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 mb-2">
            <Badge variant="summer">{categoryEmoji(activity.category)} {activity.category}</Badge>
            <Badge variant="outline" className="bg-black/30 border-white/30 text-white">
              {priceLevelLabel(activity.priceLevel)}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-white">{activity.title}</h1>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {isCreator ? (
          <Link href={`/activities/${id}/edit`} className="flex-1">
            <Button variant="outline" className="w-full">Edit Activity</Button>
          </Link>
        ) : isParticipant ? (
          <Button
            variant="outline"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => leaveActivity(id)}
            loading={leaving}
          >
            Leave Activity
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={() => joinActivity(id)}
            loading={joining}
            disabled={isFull}
          >
            {isFull ? "Activity Full" : "Join Activity"}
          </Button>
        )}

        {isParticipant && (
          <Link href={`/chat/${id}`}>
            <Button variant="ocean" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigator.share?.({ title: activity.title, url: window.location.href })}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{formatDate(activity.date)}</span>
          </div>
          {(activity.city || activity.address) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{activity.city ?? activity.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span>
              {activity.participants.length}
              {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ""} participants
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{moodEmoji(activity.mood)}</span>
            <span>{activity.mood.charAt(0) + activity.mood.slice(1).toLowerCase()} vibe</span>
          </div>
          {avgRating && (
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-semibold">{avgRating}</span>
              <span className="text-muted-foreground text-xs">
                ({activity.ratings.length} ratings)
              </span>
            </div>
          )}
          {activity.sourceUrl && (
            <a
              href={activity.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Source</span>
            </a>
          )}
        </div>

        <p className="text-sm leading-relaxed">{activity.description}</p>
      </div>

      {/* Creator */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Organized by</h2>
        <Link href={`/profile/${activity.creator.id}`} className="flex items-center gap-3 hover:opacity-80">
          <Avatar className="w-10 h-10">
            <AvatarImage src={activity.creator.avatarUrl ?? undefined} />
            <AvatarFallback>{activity.creator.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{activity.creator.username}</p>
            {activity.creator.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {activity.creator.city}
              </p>
            )}
          </div>
        </Link>
      </div>

      {/* Participants */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">
          Participants ({activity.participants.length})
        </h2>
        <div className="flex flex-wrap gap-3">
          {activity.participants.map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.user.id}`}
              className="flex flex-col items-center gap-1 hover:opacity-80"
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={p.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {p.user.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {p.user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <span className="text-xs text-muted-foreground max-w-[60px] truncate text-center">
                {p.user.username}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-border overflow-hidden h-52">
        <ActivityMap
          activities={[activity]}
          center={[activity.latitude, activity.longitude]}
          zoom={14}
        />
      </div>

      {/* Photos */}
      {activity.photos.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Photos ({activity.photos.length})
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {activity.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption ?? "Activity photo"}
                className="w-full aspect-square object-cover rounded-xl"
              />
            ))}
          </div>
        </div>
      )}

      {/* Ratings */}
      {activity.ratings.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Ratings</h2>
          {activity.ratings.map((rating) => (
            <div key={rating.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={rating.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{rating.user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{rating.user.username}</span>
                <div className="ml-auto flex gap-1 text-xs text-amber-500">
                  {["⭐", "🎯", "🎉"].map((icon, i) => (
                    <span key={i}>{icon} {[rating.activityScore, rating.organizationScore, rating.funScore][i]}</span>
                  ))}
                </div>
              </div>
              {rating.review && <p className="text-sm text-muted-foreground pl-9">{rating.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
