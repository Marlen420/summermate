import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { uploadFile, type S3Bucket } from "@/lib/s3";
import { ok, badRequest, internalError } from "@/lib/api-response";
import type { AccessTokenPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadQuerySchema = z.object({
  bucket: z.enum(["avatars", "activities", "galleries"]),
  activityId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user: AccessTokenPayload) => {
    try {
      const { searchParams } = new URL(req.url);
      const { bucket, activityId } = uploadQuerySchema.parse(
        Object.fromEntries(searchParams.entries())
      );

      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) return badRequest("No file provided");
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return badRequest("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed");
      }
      if (file.size > MAX_FILE_SIZE) {
        return badRequest("File too large. Maximum size is 10MB");
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const folder = bucket === "avatars" ? user.userId : activityId ?? user.userId;

      const { key, url } = await uploadFile(bucket as S3Bucket, buffer, file.type, folder);

      // Update avatar URL if uploading to avatars bucket
      if (bucket === "avatars") {
        await prisma.user.update({
          where: { id: user.userId },
          data: { avatarUrl: url },
        });
      }

      // Save photo metadata if uploading to galleries
      if (bucket === "galleries" && activityId) {
        await prisma.activityPhoto.create({
          data: {
            activityId,
            userId: user.userId,
            url,
            key,
            sizeBytes: file.size,
          },
        });
      }

      return ok({ url, key });
    } catch (error) {
      console.error("[upload]", error);
      return internalError();
    }
  });
}
