import { Server as HTTPServer } from "http";
import { Server as SocketServer, type Socket } from "socket.io";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

let io: SocketServer | null = null;

export function getSocketServer(): SocketServer | null {
  return io;
}

export function initSocketServer(httpServer: HTTPServer): SocketServer {
  if (io) return io;

  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
  });

  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
      const user = await verifyAccessToken(token);
      socket.data.userId = user.userId;
      socket.data.username = user.username;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(`[socket] User connected: ${socket.data.username} (${userId})`);

    // Mark user online
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    }).catch(() => {});

    socket.broadcast.emit("user:online", { userId });

    // ─── Activity Rooms ────────────────────────────────────────
    socket.on("room:join", async (activityId: string) => {
      const participant = await prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId, userId } },
      }).catch(() => null);

      if (!participant || participant.leftAt) {
        socket.emit("error", { message: "Not a participant of this activity" });
        return;
      }

      await socket.join(`activity:${activityId}`);
      socket.to(`activity:${activityId}`).emit("room:user_joined", {
        userId,
        username: socket.data.username,
      });
    });

    socket.on("room:leave", (activityId: string) => {
      socket.leave(`activity:${activityId}`);
      socket.to(`activity:${activityId}`).emit("room:user_left", {
        userId,
        username: socket.data.username,
      });
    });

    // ─── Chat Messages ─────────────────────────────────────────
    socket.on("message:send", async (data: { activityId: string; content: string }) => {
      if (!data.content?.trim() || !data.activityId) return;

      try {
        const participant = await prisma.activityParticipant.findUnique({
          where: { activityId_userId: { activityId: data.activityId, userId } },
        });
        if (!participant || participant.leftAt) return;

        const message = await prisma.activityMessage.create({
          data: {
            activityId: data.activityId,
            userId,
            content: data.content.trim().slice(0, 2000),
          },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        });

        io?.to(`activity:${data.activityId}`).emit("message:new", message);
      } catch (error) {
        console.error("[socket] message:send error", error);
      }
    });

    // ─── Typing Indicators ─────────────────────────────────────
    socket.on("typing:start", (activityId: string) => {
      socket.to(`activity:${activityId}`).emit("typing:user", {
        userId,
        username: socket.data.username,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (activityId: string) => {
      socket.to(`activity:${activityId}`).emit("typing:user", {
        userId,
        username: socket.data.username,
        isTyping: false,
      });
    });

    // ─── Read Receipts ─────────────────────────────────────────
    socket.on("message:read", async (data: { activityId: string; messageId: string }) => {
      try {
        await prisma.activityMessage.updateMany({
          where: {
            activityId: data.activityId,
            id: data.messageId,
            NOT: { readBy: { has: userId } },
          },
          data: { readBy: { push: userId } },
        });

        socket.to(`activity:${data.activityId}`).emit("message:read_by", {
          messageId: data.messageId,
          userId,
        });
      } catch (error) {
        console.error("[socket] message:read error", error);
      }
    });

    // ─── Disconnect ────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`[socket] User disconnected: ${socket.data.username}`);

      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeenAt: new Date() },
      }).catch(() => {});

      socket.broadcast.emit("user:offline", { userId, lastSeenAt: new Date() });
    });
  });

  return io;
}

// Helper to emit notification to a specific user's socket rooms
export async function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) return;
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    if (socket.data.userId === userId) {
      socket.emit(event, data);
    }
  }
}
