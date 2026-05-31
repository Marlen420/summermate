import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, created, notFound, forbidden, handleZodError, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface Params { params: { id: string } }

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const participant = await prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId: params.id, userId: user.userId } },
      });
      if (!participant) return forbidden("You must be a participant to view messages");

      const { searchParams } = new URL(req.url);
      const cursor = searchParams.get("cursor");
      const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

      const messages = await prisma.activityMessage.findMany({
        where: { activityId: params.id, isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      return ok({
        messages: messages.reverse(),
        nextCursor: messages.length === limit ? messages[0]?.id : null,
      });
    } catch (error) {
      console.error("[messages:GET]", error);
      return internalError();
    }
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: params.id, isCancelled: false },
        select: { id: true },
      });
      if (!activity) return notFound("Activity not found");

      const participant = await prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId: params.id, userId: user.userId } },
      });
      if (!participant || participant.leftAt) {
        return forbidden("You must be an active participant to send messages");
      }

      const body = await req.json();
      const { content } = messageSchema.parse(body);

      const message = await prisma.activityMessage.create({
        data: { activityId: params.id, userId: user.userId, content },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      return created(message);
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[messages:POST]", error);
      return internalError();
    }
  });
}
