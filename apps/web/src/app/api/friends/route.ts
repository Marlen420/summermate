import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

// GET /api/friends — current user's friends
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      const [friendsA, friendsB] = await Promise.all([
        prisma.friendship.findMany({
          where: { userAId: user.userId },
          include: {
            userB: {
              select: { id: true, username: true, avatarUrl: true, city: true, isOnline: true, lastSeenAt: true },
            },
          },
        }),
        prisma.friendship.findMany({
          where: { userBId: user.userId },
          include: {
            userA: {
              select: { id: true, username: true, avatarUrl: true, city: true, isOnline: true, lastSeenAt: true },
            },
          },
        }),
      ]);

      const friends = [
        ...friendsA.map((f) => ({ friendshipId: f.id, friend: f.userB, since: f.createdAt })),
        ...friendsB.map((f) => ({ friendshipId: f.id, friend: f.userA, since: f.createdAt })),
      ];

      return ok(friends);
    } catch (error) {
      console.error("[friends:GET]", error);
      return internalError();
    }
  });
}
