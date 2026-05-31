import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "h:mm a")}`;
  return format(d, "MMM d, yyyy · h:mm a");
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function priceLevelLabel(level: string): string {
  const map: Record<string, string> = {
    FREE: "Free",
    CHEAP: "$",
    MODERATE: "$$",
    EXPENSIVE: "$$$",
  };
  return map[level] ?? level;
}

export function moodEmoji(mood: string): string {
  const map: Record<string, string> = {
    ADVENTUROUS: "🏔️",
    RELAXED: "😌",
    SOCIAL: "🎉",
    CREATIVE: "🎨",
    ACTIVE: "⚡",
    ROMANTIC: "💕",
    FAMILY: "👨‍👩‍👧‍👦",
    SOLO: "🧘",
  };
  return map[mood] ?? "✨";
}

export function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    HIKING: "🥾",
    SPORTS: "⚽",
    MOVIES: "🎬",
    FESTIVALS: "🎪",
    PHOTOGRAPHY: "📸",
    FOOD: "🍔",
    MUSIC: "🎵",
    GAMING: "🎮",
    CYCLING: "🚴",
    CAMPING: "⛺",
    TRAVEL: "✈️",
    ART: "🎨",
    WELLNESS: "🧘",
    NIGHTLIFE: "🌙",
    OUTDOOR: "🌿",
    INDOOR: "🏠",
    OTHER: "🎯",
  };
  return map[category] ?? "📍";
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}
