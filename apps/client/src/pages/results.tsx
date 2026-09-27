import { useLocation, useNavigate, useParams } from "react-router-dom";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";
import { arenaPath, readGameQuery } from "@/lib/game-params";

export function ResultsPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { type, mode } = readGameQuery(location.search);
  const user = useAuthStore((s) => s.user);
  const room = useGameStore((s) => s.room);
  const stats = useGameStore((s) => s.stats);
  const winnerId = useGameStore((s) => s.winnerId);
  const resetMatch = useGameStore((s) => s.resetMatch);
  const connected = useGameStore((s) => s.connected);
  const hydrated = useGameStore((s) => s.hydrated);

  const won = winnerId === user?.id;
  const tied = winnerId === null;

  if (!hydrated || !connected) {
    return (
      <div className="grid min-h-dvh place-items-center text-white/40">
        Reconnecting...
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-lg rounded-[32px] bg-secondary p-10 text-center">
        <p className="text-xs font-medium text-red-400">MATCH OVER</p>
        <h1 className="mt-3 font-display text-6xl font-bold tracking-tighter">
          {tied ? "Draw" : won ? "You win" : "Defeat"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Room {roomId?.slice(0, 8)}</p>

        <div className="mt-8 space-y-3">
          {room?.players.map((player) => {
            const score = stats.find((s) => s.userId === player.id)?.score ?? 0;
            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-full bg-black/30 pl-3 pr-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={player.username} src={player.avatar || undefined} />
                  <span>{player.username}</span>
                </div>
                <span className="font-mono text-xl tabular-nums text-red-400">{score}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="mt-8 w-full rounded-full bg-red-400 py-4 font-display font-semibold text-background ring-4 ring-red-400 border-4 border-background text-2xl hover:bg-red-500 hover:ring-red-500 cursor-pointer"
          onClick={() => {
            resetMatch();
            navigate(arenaPath(type, mode));
          }}
        >
          Back to arena
        </button>
      </div>
    </div>
  );
}
