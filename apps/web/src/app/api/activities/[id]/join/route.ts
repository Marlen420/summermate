import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, notFound, conflict, badRequest, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface Params { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: params.id, isCancelled: false },
        include: {
          _count: { select: { participants: { where: { leftAt: null } } } },
        },
      });

      if (!activity) return notFound("Activity not found");

      if (
        activity.maxParticipants &&
        activity._count.participants >= activity.maxParticipants
      ) {
        return badRequest("This activity is full");
      }

      const existing = await prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId: params.id, userId: user.userId } },
      });

      if (existing) {
        if (!existing.leftAt) return conflict("You have already joined this activity");
        // Re-join
        await prisma.activityParticipant.update({
          where: { id: existing.id },
          data: { leftAt: null },
        });
      } else {
        await prisma.activityParticipant.create({
          data: { activityId: params.id, userId: user.userId },
        });
      }

      // Notify creator
      if (activity.creatorId !== user.userId) {
        const joiner = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { username: true },
        });
        await prisma.notification.create({
          data: {
            userId: activity.creatorId,
            type: "ACTIVITY_JOINED",
            title: "New participant",
            body: `${joiner?.username} joined your activity "${activity.title}"`,
            actorId: user.userId,
            activityId: params.id,
          },
        });
      }

      return ok({ message: "Joined successfully" });
    } catch (error) {
      console.error("[activity:join]", error);
      return internalError();
    }
  });
}
