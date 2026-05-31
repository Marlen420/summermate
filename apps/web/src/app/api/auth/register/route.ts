import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { registerSchema } from "@/lib/validation/auth";
import { created, conflict, handleZodError, internalError } from "@/lib/api-response";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
      select: { email: true, username: true },
    });

    if (existing) {
      if (existing.email === input.email) {
        return conflict("Email already in use");
      }
      return conflict("Username already taken");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        city: input.city,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        city: true,
        createdAt: true,
      },
    });

    const tokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ userId: user.id, email: user.email, username: user.username }),
      signRefreshToken({ userId: user.id, tokenId }),
    ]);

    // Persist refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt, id: tokenId },
    });

    return created({ user, accessToken, refreshToken });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    console.error("[register]", error);
    return internalError();
  }
}
