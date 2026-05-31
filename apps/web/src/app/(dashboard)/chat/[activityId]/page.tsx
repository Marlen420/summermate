"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useActivityMessages } from "@/hooks/use-activities";
import { useSocketStore } from "@/stores/socket";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string | null };
  readBy: string[];
}

interface TypingUser {
  userId: string;
  username: string;
}

export default function ChatPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { socket, joinRoom, leaveRoom } = useSocketStore();
  const { data: initialMessages, isLoading } = useActivityMessages(activityId);
  const qc = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Initialize messages from server
  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // Socket room & events
  useEffect(() => {
    if (!socket) return;

    joinRoom(activityId);

    socket.on("message:new", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing:user", ({ userId, username, isTyping: typing }: TypingUser & { isTyping: boolean }) => {
      if (userId === user?.id) return;
      setTypingUsers((prev) =>
        typing
          ? [...prev.filter((u) => u.userId !== userId), { userId, username }]
          : prev.filter((u) => u.userId !== userId)
      );
    });

    return () => {
      leaveRoom(activityId);
      socket.off("message:new");
      socket.off("typing:user");
    };
  }, [socket, activityId, joinRoom, leaveRoom, user?.id]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit("message:send", { activityId, content: input.trim() });
    setInput("");
    handleStopTyping();
  };

  const handleStartTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit("typing:start", activityId);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit("typing:stop", activityId);
    }
    clearTimeout(typingTimeoutRef.current);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-40px)] -mx-4 lg:-mx-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <p className="font-semibold text-sm">Activity Chat</p>
          <p className="text-xs text-muted-foreground">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-2">💬</p>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.user.id === user?.id;
            const showAvatar = !isOwn && (i === 0 || messages[i - 1]?.user.id !== msg.user.id);

            return (
              <div
                key={msg.id}
                className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}
              >
                {!isOwn && (
                  <div className="w-7 shrink-0">
                    {showAvatar && (
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={msg.user.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {msg.user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {!isOwn && showAvatar && (
                    <p className="text-xs font-semibold mb-0.5 text-primary">{msg.user.username}</p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    isOwn ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                  )}>
                    {formatRelativeTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-muted rounded-2xl px-4 py-2.5 flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {typingUsers.map((u) => u.username).join(", ")} is typing
              </span>
              <span className="flex gap-0.5 ml-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleStartTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={sendMessage}
            size="icon"
            disabled={!input.trim()}
            className="rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
