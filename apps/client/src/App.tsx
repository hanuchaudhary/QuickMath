import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useGameSocket } from "@/hooks/useGameSocket";
import { getToken } from "@/lib/http";
import { AuthPage } from "@/pages/auth";
import { ArenaPage } from "@/pages/arena";
import { LandingPage } from "@/pages/landing";
import { MatchmakingPage } from "@/pages/matchmaking";
import { PlaygroundPage } from "@/pages/playground";
import { ProfilePage } from "@/pages/profile";
import { ResultsPage } from "@/pages/results";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  useGameSocket(Boolean(user));

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-white/40">Loading...</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <AppShell>
      <MatchNavigator />
      {children}
    </AppShell>
  );
}

function MatchNavigator() {
  const room = useGameStore((s) => s.room);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!room) return;
    if (room.status === "PLAYING") {
      const path = `/play/${room.gameType}/${room.id}`;
      if (!location.pathname.startsWith(path)) navigate(path, { replace: true });
    }
    if (room.status === "FINISHED") {
      const path = `/play/${room.gameType}/${room.id}/results`;
      if (location.pathname !== path) navigate(path, { replace: true });
    }
  }, [location.pathname, navigate, room]);

  return null;
}

function Boot() {
  const loadMe = useAuthStore((s) => s.loadMe);
  useEffect(() => {
    if (!getToken()) {
      useAuthStore.setState({ loading: false });
      return;
    }
    void loadMe();
  }, [loadMe]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Boot />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/arena"
          element={
            <Protected>
              <ArenaPage />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <ProfilePage />
            </Protected>
          }
        />
        <Route
          path="/play/:gameType"
          element={
            <Protected>
              <MatchmakingPage />
            </Protected>
          }
        />
        <Route
          path="/play/:gameType/:roomId"
          element={
            <Protected>
              <PlaygroundPage />
            </Protected>
          }
        />
        <Route
          path="/play/:gameType/:roomId/results"
          element={
            <Protected>
              <ResultsPage />
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
