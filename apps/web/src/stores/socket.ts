import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./auth";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (activityId: string) => void;
  leaveRoom: (activityId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "", {
      path: "/api/socket",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      set({ isConnected: true });
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false });
    });

    newSocket.on("connect_error", (error) => {
      console.error("[socket] connection error", error.message);
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    socket?.disconnect();
    set({ socket: null, isConnected: false });
  },

  joinRoom: (activityId) => {
    get().socket?.emit("room:join", activityId);
  },

  leaveRoom: (activityId) => {
    get().socket?.emit("room:leave", activityId);
  },
}));
