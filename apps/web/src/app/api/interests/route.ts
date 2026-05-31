import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { ok, handleZodError, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

const updateInterestsSchema = z.object({
  interestIds: z.array(z.string().uuid()).max(20),
});

// GET /api/interests — all interests
export async function GET() {
  try {
    const interests = await prisma.interest.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });
    return ok(interests);
  } catch (error) {
    console.error("[interests:GET]", error);
    return internalError();
  }
}

// PUT /api/interests — update user's interests
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const body = await req.json();
      const { interestIds } = updateInterestsSchema.parse(body);

      await prisma.$transaction([
        prisma.userInterest.deleteMany({ where: { userId: user.userId } }),
        prisma.userInterest.createMany({
          data: interestIds.map((interestId) => ({ userId: user.userId, interestId })),
          skipDuplicates: true,
        }),
      ]);

      const updated = await prisma.userInterest.findMany({
        where: { userId: user.userId },
        include: { interest: true },
      });

      return ok(updated.map((ui) => ui.interest));
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[interests:PUT]", error);
      return internalError();
    }
  });
}
