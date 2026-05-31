import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, notFound, badRequest, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface Params { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: params.id },
        select: { creatorId: true, title: true },
      });

      if (!activity) return notFound("Activity not found");
      if (activity.creatorId === user.userId) {
        return badRequest("The creator cannot leave the activity. Cancel it instead.");
      }

      const participant = await prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId: params.id, userId: user.userId } },
      });

      if (!participant || participant.leftAt) {
        return badRequest("You are not a participant of this activity");
      }

      await prisma.activityParticipant.update({
        where: { id: participant.id },
        data: { leftAt: new Date() },
      });

      return ok({ message: "Left activity successfully" });
    } catch (error) {
      console.error("[activity:leave]", error);
      return internalError();
    }
  });
}
