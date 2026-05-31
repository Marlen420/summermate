"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, categoryEmoji, moodEmoji, priceLevelLabel, truncate } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  mood: string;
  date: string;
  city?: string | null;
  address?: string | null;
  priceLevel: string;
  creator: { id: string; username: string; avatarUrl?: string | null };
  _count: { participants: number };
  maxParticipants?: number | null;
  photos?: Array<{ url: string }>;
  ratings?: Array<{ activityScore: number; organizationScore: number; funScore: number }>;
}

interface ActivityCardProps {
  activity: Activity;
  compact?: boolean;
}

export function ActivityCard({ activity, compact = false }: ActivityCardProps) {
  const avgRating =
    activity.ratings && activity.ratings.length > 0
      ? (
          activity.ratings.reduce(
            (s, r) => s + (r.activityScore + r.organizationScore + r.funScore) / 3,
            0
          ) / activity.ratings.length
        ).toFixed(1)
      : null;

  const coverPhoto = activity.photos?.[0]?.url;
  const spotsLeft =
    activity.maxParticipants
      ? activity.maxParticipants - activity._count.participants
      : null;

  return (
    <Link href={`/activities/${activity.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5 h-full">
        {/* Cover image or gradient */}
        {!compact && (
          <div className="relative h-44 overflow-hidden">
            {coverPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPhoto}
                alt={activity.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full gradient-summer opacity-80 flex items-center justify-center">
                <span className="text-5xl">{categoryEmoji(activity.category)}</span>
              </div>
            )}

            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <Badge variant="summer" className="backdrop-blur-sm">
                {categoryEmoji(activity.category)} {activity.category}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-card/90 backdrop-blur-sm">
                {priceLevelLabel(activity.priceLevel)}
              </Badge>
            </div>
          </div>
        )}

        <CardContent className={compact ? "p-4" : "p-5"}>
          {compact && (
            <div className="flex gap-1.5 mb-2">
              <Badge variant="default" className="text-xs">
                {categoryEmoji(activity.category)} {activity.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {priceLevelLabel(activity.priceLevel)}
              </Badge>
            </div>
          )}

          <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
            {truncate(activity.title, 60)}
          </h3>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {activity.description}
          </p>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>{formatDate(activity.date)}</span>
            </div>
            {(activity.city || activity.address) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="truncate">{activity.city ?? activity.address}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>
                  {activity._count.participants}
                  {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ""} going
                </span>
                {spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0 && (
                  <Badge variant="destructive" className="text-xs ml-1">
                    {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left!
                  </Badge>
                )}
                {spotsLeft === 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">Full</Badge>
                )}
              </div>
              {avgRating && (
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-semibold">{avgRating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <Avatar className="w-6 h-6">
              <AvatarImage src={activity.creator.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {activity.creator.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              by <span className="font-medium text-foreground">{activity.creator.username}</span>
            </span>
            <span className="ml-auto text-lg">{moodEmoji(activity.mood)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
