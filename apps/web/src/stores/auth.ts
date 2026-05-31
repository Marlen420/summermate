import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        // Set default axios header
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        }));
      },

      logout: () => {
        const { accessToken, refreshToken } = get();
        if (accessToken) {
          axios
            .post(
              "/api/auth/logout",
              { refreshToken },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            .catch(() => {});
        }
        delete axios.defaults.headers.common["Authorization"];
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const { data } = await axios.post("/api/auth/refresh", { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
          set({ accessToken: newAccess, refreshToken: newRefresh });
          axios.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: "summermate-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
