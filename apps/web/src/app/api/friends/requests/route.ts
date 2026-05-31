import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, created, conflict, notFound, badRequest, handleZodError, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

const sendRequestSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

// GET /api/friends/requests — pending requests
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const { searchParams } = new URL(req.url);
      const direction = searchParams.get("direction") ?? "received";

      const requests = await prisma.friendRequest.findMany({
        where: {
          ...(direction === "sent" ? { senderId: user.userId } : { receiverId: user.userId }),
          status: "PENDING",
        },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true, city: true } },
          receiver: { select: { id: true, username: true, avatarUrl: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return ok(requests);
    } catch (error) {
      console.error("[friend-requests:GET]", error);
      return internalError();
    }
  });
}

// POST /api/friends/requests — send request
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const body = await req.json();
      const { userId: targetId } = sendRequestSchema.parse(body);

      if (targetId === user.userId) {
        return badRequest("You cannot send a friend request to yourself");
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!targetUser) return notFound("User not found");

      // Check existing friendship
      const areFriends = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: user.userId, userBId: targetId },
            { userAId: targetId, userBId: user.userId },
          ],
        },
      });
      if (areFriends) return conflict("You are already friends");

      // Check existing pending request
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: user.userId, receiverId: targetId, status: "PENDING" },
            { senderId: targetId, receiverId: user.userId, status: "PENDING" },
          ],
        },
      });
      if (existingRequest) return conflict("A friend request already exists");

      const friendRequest = await prisma.friendRequest.create({
        data: { senderId: user.userId, receiverId: targetId },
        include: {
          receiver: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      // Create notification
      const sender = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { username: true },
      });
      await prisma.notification.create({
        data: {
          userId: targetId,
          type: "FRIEND_REQUEST",
          title: "New friend request",
          body: `${sender?.username} sent you a friend request`,
          actorId: user.userId,
        },
      });

      return created(friendRequest);
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[friend-requests:POST]", error);
      return internalError();
    }
  });
}
