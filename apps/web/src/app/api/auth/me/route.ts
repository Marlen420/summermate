import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, notFound, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      const profile = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          bio: true,
          city: true,
          isOnline: true,
          createdAt: true,
          interests: {
            include: { interest: true },
          },
          _count: {
            select: {
              friendshipsA: true,
              friendshipsB: true,
              participations: true,
            },
          },
        },
      });

      if (!profile) return notFound("User not found");

      return ok(profile);
    } catch (error) {
      console.error("[me]", error);
      return internalError();
    }
  });
}
