import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { refreshToken } = body as { refreshToken?: string };

      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken, userId: user.userId },
          data: { revokedAt: new Date() },
        });
      } else {
        // Revoke all tokens for this user
        await prisma.refreshToken.updateMany({
          where: { userId: user.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      await prisma.user.update({
        where: { id: user.userId },
        data: { isOnline: false, lastSeenAt: new Date() },
      });

      return ok({ message: "Logged out successfully" });
    } catch (error) {
      console.error("[logout]", error);
      return internalError();
    }
  });
}
