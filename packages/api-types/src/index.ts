// ─── Enums ────────────────────────────────────────────────────────────────────

export type ActivityCategory =
  | "HIKING" | "SPORTS" | "MOVIES" | "FESTIVALS" | "PHOTOGRAPHY"
  | "FOOD" | "MUSIC" | "GAMING" | "CYCLING" | "CAMPING"
  | "TRAVEL" | "ART" | "WELLNESS" | "NIGHTLIFE" | "OUTDOOR" | "INDOOR" | "OTHER";

export type Mood =
  | "ADVENTUROUS" | "RELAXED" | "SOCIAL" | "CREATIVE"
  | "ACTIVE" | "ROMANTIC" | "FAMILY" | "SOLO";

export type PriceLevel = "FREE" | "CHEAP" | "MODERATE" | "EXPENSIVE";

export type NotificationType =
  | "FRIEND_REQUEST" | "FRIEND_ACCEPTED" | "EVENT_INVITATION"
  | "CHAT_MENTION" | "NEW_ACTIVITY_NEARBY" | "ACTIVITY_JOINED" | "ACTIVITY_CANCELLED";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
  city?: string | null;
  isOnline?: boolean;
}

export interface UserProfile extends UserSummary {
  email: string;
  bio: string | null;
  createdAt: string;
  interests?: Interest[];
}

export interface Interest {
  id: string;
  name: string;
  icon?: string | null;
  category?: ActivityCategory | null;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  mood: Mood;
  date: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  creatorId: string;
  maxParticipants?: number | null;
  priceLevel: PriceLevel;
  sourceUrl?: string | null;
  isCancelled: boolean;
  viewCount: number;
  createdAt: string;
  creator: UserSummary;
  _count?: { participants: number; photos?: number; messages?: number };
}

export interface ActivityDetail extends Activity {
  participants: ActivityParticipant[];
  photos: ActivityPhoto[];
  ratings: ActivityRating[];
  messages?: ActivityMessage[];
}

export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string | null;
  isInvited: boolean;
  user: UserSummary & { isOnline: boolean };
}

export interface ActivityPhoto {
  id: string;
  activityId: string;
  userId: string;
  url: string;
  key: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
  createdAt: string;
  user: Pick<UserSummary, "id" | "username">;
}

export interface ActivityMessage {
  id: string;
  activityId: string;
  userId: string;
  content: string;
  isDeleted: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
}

export interface ActivityRating {
  id: string;
  activityId: string;
  userId: string;
  activityScore: number;
  organizationScore: number;
  funScore: number;
  review?: string | null;
  createdAt: string;
  user: UserSummary;
}

export interface Route {
  id: string;
  name: string;
  userId: string;
  estimatedMinutes?: number | null;
  distanceMeters?: number | null;
  createdAt: string;
  points: RoutePoint[];
}

export interface RoutePoint {
  id: string;
  routeId: string;
  order: number;
  latitude: number;
  longitude: number;
  label?: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  actorId?: string | null;
  activityId?: string | null;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: string;
  sender: UserSummary;
  receiver: UserSummary;
}

export interface Friendship {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: true;
}

export interface ApiError {
  error: string;
  details?: unknown;
  success: false;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface SocketEvents {
  "user:online": { userId: string };
  "user:offline": { userId: string; lastSeenAt: string };
  "room:user_joined": { userId: string; username: string };
  "room:user_left": { userId: string; username: string };
  "message:new": ActivityMessage;
  "message:read_by": { messageId: string; userId: string };
  "typing:user": { userId: string; username: string; isTyping: boolean };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}
