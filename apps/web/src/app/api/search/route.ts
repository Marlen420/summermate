import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, internalError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") ?? "all"; // users | activities | interests | all

    if (!q || q.length < 2) {
      return badRequest("Query must be at least 2 characters");
    }

    const results: {
      users?: unknown[];
      activities?: unknown[];
      interests?: unknown[];
    } = {};

    const searchTerm = `%${q}%`;

    if (type === "all" || type === "users") {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          city: true,
          bio: true,
          isOnline: true,
        },
        take: 10,
      });
    }

    if (type === "all" || type === "activities") {
      results.activities = await prisma.activity.findMany({
        where: {
          isCancelled: false,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          creator: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { participants: true } },
        },
        take: 10,
        orderBy: { viewCount: "desc" },
      });
    }

    if (type === "all" || type === "interests") {
      results.interests = await prisma.interest.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        include: { _count: { select: { users: true } } },
        take: 10,
      });
    }

    return ok(results);
  } catch (error) {
    console.error("[search]", error);
    return internalError();
  }
}
