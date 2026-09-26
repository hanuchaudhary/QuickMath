import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gameTitle, isGameType, resolveGameMode } from "@quickmath/common";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";

export function MatchmakingPage() {
  const { gameType, gameMode } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const room = useGameStore((s) => s.room);
  const joinQueue = useGameStore((s) => s.joinQueue);
  const leaveQueue = useGameStore((s) => s.leaveQueue);
  const connected = useGameStore((s) => s.connected);
  const [countdown, setCountdown] = useState<number | null>(null);

  const joinedFor = useRef<string | null>(null);
  const resolvedMode = isGameType(gameType) ? resolveGameMode(gameType, gameMode) : null;

  useEffect(() => {
    if (!isGameType(gameType) || !resolvedMode) {
      navigate("/arena", { replace: true });
      return;
    }
    if (!connected) return;
    const key = `${gameType}:${resolvedMode}`;
    if (joinedFor.current === key) return;
    joinedFor.current = key;
    joinQueue(gameType, resolvedMode);
  }, [connected, gameType, joinQueue, navigate, resolvedMode]);

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

  const title =
    isGameType(gameType) && resolvedMode
      ? gameTitle(gameType, resolvedMode)
      : "Duel";

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-lg rounded-[32px] bg-panel p-10 text-center">
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

        <button
          type="button"
          className="mt-10 rounded-2xl bg-white/8 px-5 py-2 text-sm"
          onClick={() => {
            leaveQueue();
            navigate("/arena");
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
