"use client";

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";

function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useActivities(filters?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["activities", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined) params.set(k, String(v));
        });
      }
      const { data } = await axios.get(`/api/activities?${params}`);
      return data.data as {
        activities: Activity[];
        pagination: { page: number; limit: number; total: number; pages: number };
      };
    },
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ["activity", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/activities/${id}`);
      return data.data as ActivityDetail;
    },
    enabled: !!id,
  });
}

export function useJoinActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const { data } = await axios.post(
        `/api/activities/${activityId}/join`,
        {},
        { headers: authHeader() }
      );
      return data;
    },
    onSuccess: (_, activityId) => {
      qc.invalidateQueries({ queryKey: ["activity", activityId] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useLeaveActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const { data } = await axios.post(
        `/api/activities/${activityId}/leave`,
        {},
        { headers: authHeader() }
      );
      return data;
    },
    onSuccess: (_, activityId) => {
      qc.invalidateQueries({ queryKey: ["activity", activityId] });
    },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data } = await axios.post("/api/activities", input, {
        headers: authHeader(),
      });
      return data.data as ActivityDetail;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useActivityMessages(activityId: string) {
  return useQuery({
    queryKey: ["messages", activityId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/activities/${activityId}/messages`, {
        headers: authHeader(),
      });
      return data.data.messages as Message[];
    },
    enabled: !!activityId,
    refetchInterval: false,
  });
}

export function useActivityRatings(activityId: string) {
  return useQuery({
    queryKey: ["ratings", activityId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/activities/${activityId}/ratings`);
      return data.data as { ratings: Rating[]; averages: Averages | null; count: number };
    },
    enabled: !!activityId,
  });
}

export function useRandomActivity() {
  return useMutation({
    mutationFn: async (input: RandomActivityInput) => {
      const { data } = await axios.post("/api/random-activity", input);
      return data.data as { activities: Activity[]; relaxed: boolean };
    },
  });
}

// Types
interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  mood: string;
  date: string;
  city?: string | null;
  address?: string | null;
  priceLevel: string;
  latitude: number;
  longitude: number;
  maxParticipants?: number | null;
  creator: { id: string; username: string; avatarUrl?: string | null };
  _count: { participants: number; photos: number };
}

interface ActivityDetail extends Activity {
  participants: Array<{
    id: string;
    joinedAt: string;
    user: { id: string; username: string; avatarUrl?: string | null; isOnline: boolean };
  }>;
  photos: Array<{ id: string; url: string; caption?: string | null; user: { id: string; username: string } }>;
  ratings: Array<{
    id: string;
    activityScore: number;
    organizationScore: number;
    funScore: number;
    review?: string | null;
    user: { id: string; username: string; avatarUrl?: string | null };
  }>;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string | null };
  readBy: string[];
}

interface Rating {
  id: string;
  activityScore: number;
  organizationScore: number;
  funScore: number;
  review?: string | null;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string | null };
}

interface Averages {
  activity: number;
  organization: number;
  fun: number;
}

interface CreateActivityInput {
  title: string;
  description: string;
  category: string;
  mood: string;
  date: Date;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  maxParticipants?: number;
  priceLevel: string;
  sourceUrl?: string;
}

interface RandomActivityInput {
  mood?: string;
  budget?: string;
  groupSize?: number;
  lat?: number;
  lng?: number;
}
