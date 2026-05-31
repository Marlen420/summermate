import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";

export type AuthenticatedRequest = NextRequest & {
  user: AccessTokenPayload;
};

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: AccessTokenPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  try {
    const user = await verifyAccessToken(token);
    return handler(request, user);
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
