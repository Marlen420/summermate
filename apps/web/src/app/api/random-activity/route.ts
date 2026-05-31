import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { randomActivitySchema } from "@/lib/validation/activity";
import { ok, handleZodError, internalError } from "@/lib/api-response";
import { ActivityCategory, Mood, PriceLevel } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// Rule engine: mood → preferred categories
const moodCategoryMap: Record<Mood, ActivityCategory[]> = {
  ADVENTUROUS: [ActivityCategory.HIKING, ActivityCategory.CYCLING, ActivityCategory.CAMPING, ActivityCategory.OUTDOOR],
  RELAXED: [ActivityCategory.FOOD, ActivityCategory.MOVIES, ActivityCategory.WELLNESS, ActivityCategory.INDOOR],
  SOCIAL: [ActivityCategory.FESTIVALS, ActivityCategory.FOOD, ActivityCategory.MUSIC, ActivityCategory.NIGHTLIFE],
  CREATIVE: [ActivityCategory.ART, ActivityCategory.PHOTOGRAPHY, ActivityCategory.MUSIC, ActivityCategory.INDOOR],
  ACTIVE: [ActivityCategory.SPORTS, ActivityCategory.HIKING, ActivityCategory.CYCLING, ActivityCategory.OUTDOOR],
  ROMANTIC: [ActivityCategory.FOOD, ActivityCategory.MUSIC, ActivityCategory.ART, ActivityCategory.TRAVEL],
  FAMILY: [ActivityCategory.FOOD, ActivityCategory.MOVIES, ActivityCategory.FESTIVALS, ActivityCategory.OUTDOOR],
  SOLO: [ActivityCategory.PHOTOGRAPHY, ActivityCategory.HIKING, ActivityCategory.GAMING, ActivityCategory.INDOOR],
};

// Budget → price levels
const budgetPriceLevelMap: Record<PriceLevel, PriceLevel[]> = {
  FREE: [PriceLevel.FREE],
  CHEAP: [PriceLevel.FREE, PriceLevel.CHEAP],
  MODERATE: [PriceLevel.FREE, PriceLevel.CHEAP, PriceLevel.MODERATE],
  EXPENSIVE: [PriceLevel.FREE, PriceLevel.CHEAP, PriceLevel.MODERATE, PriceLevel.EXPENSIVE],
};

// Group size → max participants range
function getParticipantRange(groupSize?: number): { min?: number; max?: number } {
  if (!groupSize) return {};
  if (groupSize <= 2) return { min: 2, max: 5 };
  if (groupSize <= 5) return { min: 3, max: 15 };
  if (groupSize <= 10) return { min: 8, max: 30 };
  return { min: 20 };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = randomActivitySchema.parse(body);

    const where: Prisma.ActivityWhereInput = {
      isCancelled: false,
      date: { gte: new Date() },
    };

    // Apply mood filter
    if (input.mood) {
      where.category = { in: moodCategoryMap[input.mood] };
      where.mood = input.mood;
    }

    // Apply budget filter
    if (input.budget) {
      where.priceLevel = { in: budgetPriceLevelMap[input.budget] };
    }

    // Apply group size filter
    if (input.groupSize) {
      const range = getParticipantRange(input.groupSize);
      if (range.min || range.max) {
        where.maxParticipants = {
          ...(range.min ? { gte: range.min } : {}),
          ...(range.max ? { lte: range.max } : {}),
        };
      }
    }

    // Geo filter
    if (input.lat && input.lng) {
      const deg = 50 / 111; // ~50km radius
      where.latitude = { gte: input.lat - deg, lte: input.lat + deg };
      where.longitude = { gte: input.lng - deg, lte: input.lng + deg };
    }

    const count = await prisma.activity.count({ where });
    if (count === 0) {
      // Relax filters progressively
      const relaxedWhere: Prisma.ActivityWhereInput = {
        isCancelled: false,
        date: { gte: new Date() },
        ...(input.mood ? { mood: input.mood } : {}),
      };
      const relaxed = await prisma.activity.findMany({
        where: relaxedWhere,
        take: 5,
        orderBy: { viewCount: "desc" },
        include: {
          creator: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { participants: true } },
        },
      });
      return ok({ activities: relaxed, relaxed: true });
    }

    // Pick random offset
    const skip = Math.floor(Math.random() * Math.min(count, 50));

    const activities = await prisma.activity.findMany({
      where,
      skip,
      take: 3,
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { participants: true } },
      },
    });

    return ok({ activities, relaxed: false });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    console.error("[random-activity]", error);
    return internalError();
  }
}
