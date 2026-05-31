import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";
import type { UserProfile } from "@summermate/api-types";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const [user, accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("accessToken"),
        AsyncStorage.getItem("refreshToken"),
      ]);

      if (user && accessToken) {
        set({
          user: JSON.parse(user),
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      AsyncStorage.setItem("user", JSON.stringify(user)),
      AsyncStorage.setItem("accessToken", accessToken),
      AsyncStorage.setItem("refreshToken", refreshToken),
    ]);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  logout: async () => {
    const { accessToken, refreshToken } = get();
    try {
      await api.post("/auth/logout", { refreshToken }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {}
    await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
