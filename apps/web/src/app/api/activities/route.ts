import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { createActivitySchema, activityFiltersSchema } from "@/lib/validation/activity";
import { ok, created, handleZodError, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";
import type { Prisma } from "@prisma/client";

// GET /api/activities — list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const filters = activityFiltersSchema.parse(params);

    const where: Prisma.ActivityWhereInput = {
      isCancelled: false,
      date: { gte: new Date() },
    };

    if (filters.category) where.category = filters.category;
    if (filters.mood) where.mood = filters.mood;
    if (filters.priceLevel) where.priceLevel = filters.priceLevel;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      };
    }

    // Geo bounding box filter (approximate)
    if (filters.lat && filters.lng) {
      const deg = filters.radiusKm / 111;
      where.latitude = { gte: filters.lat - deg, lte: filters.lat + deg };
      where.longitude = { gte: filters.lng - deg, lte: filters.lng + deg };
    }

    const orderBy: Prisma.ActivityOrderByWithRelationInput =
      filters.sort === "newest"
        ? { createdAt: "desc" }
        : filters.sort === "popularity"
        ? { viewCount: "desc" }
        : { date: "asc" };

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          creator: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: {
            select: { participants: true, photos: true },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return ok({
      activities,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    console.error("[activities:GET]", error);
    return internalError();
  }
}

// POST /api/activities — create
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const body = await req.json();
      const input = createActivitySchema.parse(body);

      const activity = await prisma.activity.create({
        data: {
          ...input,
          creatorId: user.userId,
          participants: {
            create: { userId: user.userId },
          },
        },
        include: {
          creator: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: { select: { participants: true } },
        },
      });

      return created(activity);
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[activities:POST]", error);
      return internalError();
    }
  });
}
