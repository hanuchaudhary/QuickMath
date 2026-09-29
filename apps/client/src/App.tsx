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
import { playPath } from "@/lib/game-params";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CompetePage } from "./pages/compete";
import CreateRoomPage from "./pages/create";
import { JoinRoomPage } from "./pages/join";
import { ChallengePopover } from "./components/challange-popover";
import { Toaster } from "sonner";


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
      <ResumeDuelDialog />
      {children}
    </AppShell>
  );
}

function MatchNavigator() {
  const { room, pendingResume } = useGameStore();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (pendingResume) return;
    if (!room) return;
    if (room.isPrivate) {
      if (room.status === "WAITING" || room.status === "STARTING") {
        const path = `/compete/join?joinCode=${room.joinCode}`;

        if (`${location.pathname}${location.search}` !== path) {
          navigate(path, { replace: true });
        }

        return;
      }

      if (room.status === "PLAYING") {
        const path = playPath(
          room.gameType,
          room.gameMode,
          room.id
        );

        if (`${location.pathname}${location.search}` !== path) {
          navigate(path, { replace: true });
        }

        return;
      }

      if (room.status === "FINISHED") {
        const path = playPath(
          room.gameType,
          room.gameMode,
          room.id,
          true
        );

        if (`${location.pathname}${location.search}` !== path) {
          navigate(path, { replace: true });
        }

        return;
      }
    }

    if (
      room.status === "WAITING" ||
      room.status === "STARTING"
    ) {
      const path = playPath(
        room.gameType,
        room.gameMode
      );

      if (`${location.pathname}${location.search}` !== path) {
        navigate(path, { replace: true });
      }

      return;
    }

    if (room.status === "PLAYING") {
      const path = playPath(
        room.gameType,
        room.gameMode,
        room.id
      );

      if (`${location.pathname}${location.search}` !== path) {
        navigate(path, { replace: true });
      }

      return;
    }

    if (room.status === "FINISHED") {
      const path = playPath(
        room.gameType,
        room.gameMode,
        room.id,
        true
      );

      if (`${location.pathname}${location.search}` !== path) {
        navigate(path, { replace: true });
      }
    }
  }, [
    location.pathname,
    location.search,
    navigate,
    pendingResume,
    room,
  ]);

  return null;
}

function ResumeDuelDialog() {
  const pendingResume = useGameStore((s) => s.pendingResume);
  const resumeMatch = useGameStore((s) => s.resumeMatch);
  const declineResume = useGameStore((s) => s.declineResume);

  return (
    <ConfirmDialog
      open={Boolean(pendingResume)}
      dismissible={false}
      eyebrow="STILL LIVE"
      title="DUEL ON PAUSE"
      body="You dropped mid-match. Jump back in, or tap out and hand the win to your rival."
      confirmLabel="Jump back in"
      cancelLabel="Tap out"
      onClose={() => { }}
      onCancel={declineResume}
      onConfirm={resumeMatch}
    />
  );
}

function OwnProfileRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={`/profile/${user.username}`} replace />;
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
    <main className="relative">

      <BrowserRouter>
        <Boot />
        <ChallengePopover />
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
                <OwnProfileRedirect />
              </Protected>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <Protected>
                <ProfilePage />
              </Protected>
            }
          />
          <Route
            path="/play"
            element={
              <Protected>
                <MatchmakingPage />
              </Protected>
            }
          />
          <Route
            path="/play/:roomId"
            element={
              <Protected>
                <PlaygroundPage />
              </Protected>
            }
          />
          <Route
            path="/play/:roomId/results"
            element={
              <Protected>
                <ResultsPage />
              </Protected>
            }
          />
          <Route
            path="/compete"
            element={
              <Protected>
                <CompetePage />
              </Protected>
            }
          />
          <Route
            path="/compete/create"
            element={
              <Protected>
                <CreateRoomPage />
              </Protected>
            }
          />
          <Route
            path="/compete/join"
            element={
              <Protected>
                <JoinRoomPage />
              </Protected>
            }
          />
        </Routes>
        <Toaster toastOptions={{
          style: {
            backgroundColor: "var(--background)",
            color: "var(--text)",
            borderRadius: "20px",
            border: "1px solid var(--secondary)",
            borderBottom: "6px solid var(--secondary)",
            fontFamily: "var(--font-display)",
            fontSize: "16px",
            lineHeight: 1,
          },
          classNames: {
            closeButton: "size-6! bg-secondary! border-border! border-b-4! rounded-sm! text-white! stroke-4!",
          },
          closeButton: true,
        }}
        />
      </BrowserRouter>
    </main>
  );
}
