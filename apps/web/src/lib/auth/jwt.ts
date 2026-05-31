import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  tokenId: string;
}

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, keyof JWTPayload>
): Promise<string> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET not set");

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN ?? "15m")
    .setIssuer("summermate")
    .sign(getSecret(secret));
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, keyof JWTPayload>
): Promise<string> {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET not set");

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d")
    .setIssuer("summermate")
    .sign(getSecret(secret));
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET not set");

  const { payload } = await jwtVerify(token, getSecret(secret), {
    issuer: "summermate",
  });
  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET not set");

  const { payload } = await jwtVerify(token, getSecret(secret), {
    issuer: "summermate",
  });
  return payload as RefreshTokenPayload;
}
