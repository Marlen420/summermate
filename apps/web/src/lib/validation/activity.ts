import { z } from "zod";
import { ActivityCategory, Mood, PriceLevel } from "@prisma/client";

export const createActivitySchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.nativeEnum(ActivityCategory),
  mood: z.nativeEnum(Mood),
  date: z.coerce.date(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  maxParticipants: z.number().int().positive().optional(),
  priceLevel: z.nativeEnum(PriceLevel).default(PriceLevel.FREE),
  sourceUrl: z.string().url().optional(),
});

export const activityFiltersSchema = z.object({
  category: z.nativeEnum(ActivityCategory).optional(),
  mood: z.nativeEnum(Mood).optional(),
  priceLevel: z.nativeEnum(PriceLevel).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(500).default(50),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(["date", "distance", "popularity", "newest"]).default("date"),
});

export const randomActivitySchema = z.object({
  mood: z.nativeEnum(Mood).optional(),
  budget: z.nativeEnum(PriceLevel).optional(),
  groupSize: z.coerce.number().int().positive().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const ratingSchema = z.object({
  activityScore: z.number().int().min(1).max(5),
  organizationScore: z.number().int().min(1).max(5),
  funScore: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

export const routeSchema = z.object({
  name: z.string().min(1).max(100),
  points: z
    .array(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        label: z.string().optional(),
      })
    )
    .min(2, "Route must have at least 2 points"),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type ActivityFilters = z.infer<typeof activityFiltersSchema>;
export type RandomActivityInput = z.infer<typeof randomActivitySchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type RouteInput = z.infer<typeof routeSchema>;
