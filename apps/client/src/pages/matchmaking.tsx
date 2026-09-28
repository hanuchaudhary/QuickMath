import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameTitle } from "@quickmath/common";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";
import { arenaPath, playPath, readGameQuery } from "@/lib/game-params";
import { ThreeDButton } from "@/components/ui/3d-button";

export function MatchmakingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { joinQueue, leaveQueue, connected, hydrated, pendingResume, room } = useGameStore();
  const [countdown, setCountdown] = useState<number | null>(null);
  const { hasGame, type: gameType, mode: resolvedMode } = readGameQuery(location.search);

  const joinedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!hasGame) {
      navigate(arenaPath(gameType, resolvedMode), { replace: true });
      return;
    }
    const expected = playPath(gameType, resolvedMode);
    if (`${location.pathname}${location.search}` !== expected) {
      navigate(expected, { replace: true });
    }
    if (!connected || !hydrated) return;
    if (pendingResume) return;
    if (room && room.status !== "FINISHED") return;
    const key = `${gameType}:${resolvedMode}`;
    if (joinedFor.current === key) return;
    joinedFor.current = key;
    joinQueue(gameType, resolvedMode);
  }, [connected, gameType, hasGame, hydrated, joinQueue, location.pathname, location.search, navigate, pendingResume, resolvedMode, room]);

  useEffect(() => {
    if (room?.status !== "STARTING") {
      setCountdown(null);
      return;
    }
    const startedAt = Date.now();
    setCountdown(3);
    const timer = window.setInterval(() => {
      const left = 3 - Math.floor((Date.now() - startedAt) / 1000);
      setCountdown(Math.max(left, 0));
    }, 100);
    return () => window.clearInterval(timer);
  }, [room?.id, room?.status]);

  const title = gameTitle(gameType, resolvedMode);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-lg rounded-[32px] bg-secondary p-10 text-center">
        <p className="text-sm font-medium text-red-400">{gameType ?? "GAME"}</p>
        <h1 className="mt-3 font-display text-6xl font-bold tracking-tighter">{title}</h1>
        <p className="mt-2 text-sm text-white/40">
          {room?.status === "STARTING"
            ? "Matched. Get ready."
            : `Waiting for players ${room ? `(${room.players.length}/${room.gameConfig.maxPlayersCount})` : ""}`}
        </p>
        {countdown !== null ? (
          <p className="mt-6 font-display text-7xl font-semibold tabular-nums text-red-400">
            {countdown === 0 ? "GO" : countdown}
          </p>
        ) : null}

        <div className="mt-10 flex items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar name={user?.username ?? "You"} src={user?.avatar} size="lg" />
            <span className="text-sm">{user?.username}</span>
          </div>
          <span className="font-display text-xl text-white/30">VS</span>
          <div className="flex flex-col items-center gap-2">
            {room && room.players.length > 1 ? (
              room.players
                .filter((p) => p.id !== user?.id)
                .map((player) => (
                  <div key={player.id} className="flex flex-col items-center gap-2 pop-in">
                    <UserAvatar name={player.username} src={player.avatar || undefined} size="lg" />
                    <span className="text-sm">{player.username}</span>
                  </div>
                ))
            ) : (
              <div className="grid size-14 place-items-center rounded-full border border-dashed border-white/20">
                <span className="match-pulse size-3 rounded-full bg-red-400" />
              </div>
            )}
          </div>
        </div>

        <ThreeDButton
          type="button"
          className="mt-10 bg-neutral-600 border-neutral-500 text-white py-2 w-fit px-10"
          onClick={() => {
            leaveQueue();
            navigate(arenaPath(gameType, resolvedMode));
          }}
        >
          Cancel
        </ThreeDButton>
      </div>
    </div>
  );
}
