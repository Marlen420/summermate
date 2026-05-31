import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { noContent, notFound, forbidden, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface Params { params: { id: string } }

// DELETE /api/friends/:id — remove friend (id is the friendship ID)
export async function DELETE(request: NextRequest, { params }: Params) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: params.id },
      });

      if (!friendship) return notFound("Friendship not found");

      if (friendship.userAId !== user.userId && friendship.userBId !== user.userId) {
        return forbidden("You are not part of this friendship");
      }

      await prisma.friendship.delete({ where: { id: params.id } });

      return noContent();
    } catch (error) {
      console.error("[friends:DELETE]", error);
      return internalError();
    }
  });
}
