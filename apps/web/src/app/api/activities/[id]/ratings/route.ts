import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ratingSchema } from "@/lib/validation/activity";
import { ok, created, notFound, conflict, badRequest, handleZodError, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface Params { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const ratings = await prisma.activityRating.findMany({
      where: { activityId: params.id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const avg = ratings.length
      ? {
          activity: ratings.reduce((s, r) => s + r.activityScore, 0) / ratings.length,
          organization: ratings.reduce((s, r) => s + r.organizationScore, 0) / ratings.length,
          fun: ratings.reduce((s, r) => s + r.funScore, 0) / ratings.length,
        }
      : null;

    return ok({ ratings, averages: avg, count: ratings.length });
  } catch (error) {
    console.error("[ratings:GET]", error);
    return internalError();
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: params.id },
        select: { id: true, date: true },
      });

      if (!activity) return notFound("Activity not found");

      if (activity.date > new Date()) {
        return badRequest("Cannot rate an activity that hasn't happened yet");
      }

      const participated = await prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId: params.id, userId: user.userId } },
      });

      if (!participated) return badRequest("You must participate in the activity to rate it");

      const existing = await prisma.activityRating.findUnique({
        where: { activityId_userId: { activityId: params.id, userId: user.userId } },
      });

      if (existing) return conflict("You have already rated this activity");

      const body = await req.json();
      const input = ratingSchema.parse(body);

      const rating = await prisma.activityRating.create({
        data: { ...input, activityId: params.id, userId: user.userId },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      });

      return created(rating);
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[ratings:POST]", error);
      return internalError();
    }
  });
}
