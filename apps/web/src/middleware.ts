import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/telegram",
  "/api/activities",
  "/api/search",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check API routes
  if (pathname.startsWith("/api/")) {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    try {
      await verifyAccessToken(token);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Invalid token", success: false }, { status: 401 });
    }
  }

  // For page routes, let the client handle auth redirect
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
