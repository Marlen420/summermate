import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, notFound, forbidden, badRequest, handleZodError, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface Params { params: { id: string } }

const respondSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

// PATCH /api/friends/requests/:id — accept or reject
export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const body = await req.json();
      const { action } = respondSchema.parse(body);

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: params.id },
        include: {
          sender: { select: { id: true, username: true } },
        },
      });

      if (!friendRequest) return notFound("Friend request not found");
      if (friendRequest.receiverId !== user.userId) return forbidden("You cannot respond to this request");
      if (friendRequest.status !== "PENDING") return badRequest("This request has already been responded to");

      if (action === "accept") {
        await prisma.$transaction([
          prisma.friendRequest.update({
            where: { id: params.id },
            data: { status: "ACCEPTED" },
          }),
          prisma.friendship.create({
            data: { userAId: friendRequest.senderId, userBId: user.userId },
          }),
        ]);

        const accepter = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { username: true },
        });

        await prisma.notification.create({
          data: {
            userId: friendRequest.senderId,
            type: "FRIEND_ACCEPTED",
            title: "Friend request accepted",
            body: `${accepter?.username} accepted your friend request`,
            actorId: user.userId,
          },
        });

        return ok({ message: "Friend request accepted" });
      } else {
        await prisma.friendRequest.update({
          where: { id: params.id },
          data: { status: "REJECTED" },
        });
        return ok({ message: "Friend request rejected" });
      }
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[friend-requests:PATCH]", error);
      return internalError();
    }
  });
}
