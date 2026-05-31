"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Check, X, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token}` };
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "find">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const qc = useQueryClient();

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data } = await axios.get("/api/friends", { headers: authHeader() });
      return data.data as FriendItem[];
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const { data } = await axios.get("/api/friends/requests?direction=received", {
        headers: authHeader(),
      });
      return data.data as FriendRequest[];
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      const { data } = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users`);
      return data.data.users as SearchUser[];
    },
    enabled: searchQuery.length >= 2,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "accept" | "reject" }) => {
      await axios.patch(`/api/friends/requests/${requestId}`, { action }, { headers: authHeader() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axios.post("/api/friends/requests", { userId }, { headers: authHeader() });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      await axios.delete(`/api/friends/${friendshipId}`, { headers: authHeader() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const tabs = [
    { id: "friends" as const, label: "Friends", count: friends?.length },
    { id: "requests" as const, label: "Requests", count: requests?.length },
    { id: "find" as const, label: "Find People" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count ? (
              <Badge variant="default" className="h-4 px-1.5 text-[10px]">
                {tab.count}
              </Badge>
            ) : null}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {activeTab === "friends" && (
        <div>
          {friendsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : friends?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No friends yet</p>
              <p className="text-sm">Find people in the Find People tab</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends?.map((item) => (
                <div key={item.friendshipId} className="flex items-center gap-3 p-4 rounded-2xl border border-border hover:bg-accent transition-colors">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={item.friend.avatarUrl ?? undefined} />
                      <AvatarFallback>{item.friend.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {item.friend.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.friend.username}</p>
                    {item.friend.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.friend.city}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Friends since {formatRelativeTime(item.since)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/profile/${item.friend.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeFriendMutation.mutate(item.friendshipId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === "requests" && (
        <div className="space-y-2">
          {requestsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : requests?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-2">✉️</p>
              <p className="font-medium">No pending requests</p>
            </div>
          ) : (
            requests?.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={req.sender.avatarUrl ?? undefined} />
                  <AvatarFallback>{req.sender.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{req.sender.username}</p>
                  {req.sender.city && (
                    <p className="text-xs text-muted-foreground">{req.sender.city}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respondMutation.mutate({ requestId: req.id, action: "accept" })}
                    loading={respondMutation.isPending}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => respondMutation.mutate({ requestId: req.id, action: "reject" })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Find people tab */}
      {activeTab === "find" && (
        <div className="space-y-4">
          <Input
            placeholder="Search by username or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults && searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={u.avatarUrl ?? undefined} />
                    <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{u.username}</p>
                    {u.city && <p className="text-xs text-muted-foreground">{u.city}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendRequestMutation.mutate(u.id)}
                    loading={sendRequestMutation.isPending}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No users found for "{searchQuery}"
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FriendItem {
  friendshipId: string;
  since: string;
  friend: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    city?: string | null;
    isOnline: boolean;
    lastSeenAt?: string | null;
  };
}

interface FriendRequest {
  id: string;
  sender: { id: string; username: string; avatarUrl?: string | null; city?: string | null };
}

interface SearchUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  city?: string | null;
  isOnline: boolean;
}
