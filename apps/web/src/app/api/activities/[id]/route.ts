import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { createActivitySchema } from "@/lib/validation/activity";
import {
  ok,
  notFound,
  forbidden,
  handleZodError,
  internalError,
  noContent,
} from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface Params {
  params: { id: string };
}

// GET /api/activities/:id
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true, city: true } },
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, isOnline: true } },
          },
        },
        photos: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { id: true, username: true } } },
        },
        ratings: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
        _count: { select: { participants: true, messages: true, photos: true } },
      },
    });

    if (!activity) return notFound("Activity not found");

    // Increment view count
    await prisma.activity.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return ok(activity);
  } catch (error) {
    console.error("[activity:GET]", error);
    return internalError();
  }
}

// PATCH /api/activities/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: params.id },
        select: { creatorId: true },
      });

      if (!activity) return notFound("Activity not found");
      if (activity.creatorId !== user.userId) return forbidden("Only the creator can edit this activity");

      const body = await req.json();
      const input = createActivitySchema.partial().parse(body);

      const updated = await prisma.activity.update({
        where: { id: params.id },
        data: input,
        include: {
          creator: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { participants: true } },
        },
      });

      return ok(updated);
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[activity:PATCH]", error);
      return internalError();
    }
  });
}

// DELETE /api/activities/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: params.id },
        select: { creatorId: true },
      });

      if (!activity) return notFound("Activity not found");
      if (activity.creatorId !== user.userId) return forbidden("Only the creator can delete this activity");

      await prisma.activity.update({
        where: { id: params.id },
        data: { isCancelled: true },
      });

      return noContent();
    } catch (error) {
      console.error("[activity:DELETE]", error);
      return internalError();
    }
  });
}
