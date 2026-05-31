import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { routeSchema } from "@/lib/validation/activity";
import { ok, created, handleZodError, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

const ORS_BASE = process.env.ORS_BASE_URL ?? "https://api.openrouteservice.org";

interface ORSRoute {
  summary?: { duration?: number; distance?: number };
}

async function fetchRouteFromORS(
  points: { latitude: number; longitude: number }[]
): Promise<{ durationMinutes: number; distanceMeters: number } | null> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return null;

  try {
    const coordinates = points.map((p) => [p.longitude, p.latitude]);
    const response = await fetch(`${ORS_BASE}/v2/directions/driving-car/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ coordinates }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { routes?: ORSRoute[] };
    const route = data.routes?.[0];
    if (!route?.summary) return null;

    return {
      durationMinutes: Math.round((route.summary.duration ?? 0) / 60),
      distanceMeters: route.summary.distance ?? 0,
    };
  } catch {
    return null;
  }
}

// GET /api/routes — user's routes
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user: AccessTokenPayload) => {
    try {
      const routes = await prisma.route.findMany({
        where: { userId: user.userId },
        include: { points: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      return ok(routes);
    } catch (error) {
      console.error("[routes:GET]", error);
      return internalError();
    }
  });
}

// POST /api/routes — create route
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const body = await req.json();
      const input = routeSchema.parse(body);

      const orsData = await fetchRouteFromORS(input.points);

      const route = await prisma.route.create({
        data: {
          name: input.name,
          userId: user.userId,
          estimatedMinutes: orsData?.durationMinutes,
          distanceMeters: orsData?.distanceMeters,
          points: {
            create: input.points.map((p, i) => ({
              order: i,
              latitude: p.latitude,
              longitude: p.longitude,
              label: p.label,
            })),
          },
        },
        include: { points: { orderBy: { order: "asc" } } },
      });

      return created(route);
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      console.error("[routes:POST]", error);
      return internalError();
    }
  });
}
