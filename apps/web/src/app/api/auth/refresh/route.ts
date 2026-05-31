import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { refreshSchema } from "@/lib/validation/auth";
import { ok, unauthorized, handleZodError, internalError } from "@/lib/api-response";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = refreshSchema.parse(body);

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return unauthorized("Invalid or expired refresh token");
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, username: true } } },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return unauthorized("Refresh token is invalid or revoked");
    }

    // Rotate: revoke old, issue new
    const newTokenId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        username: storedToken.user.username,
      }),
      signRefreshToken({ userId: storedToken.user.id, tokenId: newTokenId }),
    ]);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          id: newTokenId,
          token: newRefreshToken,
          userId: storedToken.user.id,
          expiresAt,
        },
      }),
    ]);

    return ok({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    console.error("[refresh]", error);
    return internalError();
  }
}
