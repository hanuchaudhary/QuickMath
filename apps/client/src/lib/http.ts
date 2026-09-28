const TOKEN_KEY = "quickmath_token";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  avatar: string;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
  };

  if (response.status === 401) {
    setToken(null);
  }

  if (!response.ok) {
    throw new ApiError(response.status, body.message ?? "Request failed");
  }

  return body as T;
}

export const http = {
  register: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signin: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>("/api/v1/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ message: string }>("/api/v1/auth/logout", { method: "POST" }),
  me: () => request<{ user: AuthUser }>("/api/v1/auth/me"),
  updateMe: (data: { avatar?: string }) =>
    request<{ user: AuthUser }>("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  myStats: () =>
    request<{ stats: { gamesPlayed: number; wins: number; totalScore: number } }>(
      "/api/v1/users/me/stats",
    ),
  listGames: () =>
    request<{
      games: {
        id: string;
        type: string;
        mode: string;
        status: string;
        score: number;
        questionsAnswered: number;
        createdAt: string;
        opponents: { id: string; username: string; avatar: string; score: number }[];
      }[];
    }>("/api/v1/games"),
  getProfile: (username: string) =>
    request<{
      user: { id: string; username: string; avatar: string; email?: string };
      stats: { gamesPlayed: number; wins: number; totalScore: number };
      games: {
        id: string;
        type: string;
        mode: string;
        status: string;
        score: number;
        questionsAnswered: number;
        createdAt: string;
        opponents: { id: string; username: string; avatar: string; score: number }[];
      }[];
    }>(`/api/v1/users/${encodeURIComponent(username)}`),
  getGame: (id: string) =>
    request<{
      game: {
        id: string;
        type: string;
        mode: string;
        status: string;
        score: number;
        opponents: { id: string; username: string; avatar: string; score: number }[];
      };
    }>(`/api/v1/games/${id}`),

  
};
