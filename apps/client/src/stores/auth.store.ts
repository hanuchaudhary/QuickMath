import { create } from "zustand";
import { http, setToken, type AuthUser } from "../lib/http";
import { useGameStore } from "./game.store";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  loadMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  loadMe: async () => {
    try {
      const { user } = await http.me();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const { user, token } = await http.signin(email, password);
    setToken(token);
    set({ user });
  },
  register: async (email, password) => {
    const { user, token } = await http.register(email, password);
    setToken(token);
    set({ user });
  },
  logout: async () => {
    try {
      await http.logout();
    } catch {
      // token may already be invalid
    }
    setToken(null);
    useGameStore.getState().disconnect();
    set({ user: null });
  },
}));
