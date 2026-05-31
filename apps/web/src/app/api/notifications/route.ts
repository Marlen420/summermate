import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

// GET /api/notifications
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const { searchParams } = new URL(req.url);
      const unreadOnly = searchParams.get("unread") === "true";
      const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);
      const cursor = searchParams.get("cursor");

      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.userId,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: user.userId, isRead: false },
      });

      return ok({
        notifications,
        unreadCount,
        nextCursor: notifications.length === limit ? notifications[notifications.length - 1]?.id : null,
      });
    } catch (error) {
      console.error("[notifications:GET]", error);
      return internalError();
    }
  });
}

// PATCH /api/notifications — mark all as read
export async function PATCH(request: NextRequest) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true },
      });
      return ok({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("[notifications:PATCH]", error);
      return internalError();
    }
  });
}
