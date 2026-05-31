import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validation/auth";
import { ok, unauthorized, handleZodError, internalError } from "@/lib/api-response";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        avatarUrl: true,
        bio: true,
        city: true,
        createdAt: true,
      },
    });

    if (!user) {
      return unauthorized("Invalid email or password");
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      return unauthorized("Invalid email or password");
    }

    const tokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ userId: user.id, email: user.email, username: user.username }),
      signRefreshToken({ userId: user.id, tokenId }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt, id: tokenId },
    });

    // Update online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    });

    const { passwordHash: _, ...safeUser } = user;

    return ok({ user: safeUser, accessToken, refreshToken });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    console.error("[login]", error);
    return internalError();
  }
}
