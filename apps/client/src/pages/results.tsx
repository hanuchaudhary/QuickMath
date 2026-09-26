import { useNavigate, useParams } from "react-router-dom";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";

export function ResultsPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const room = useGameStore((s) => s.room);
  const stats = useGameStore((s) => s.stats);
  const winnerId = useGameStore((s) => s.winnerId);
  const resetMatch = useGameStore((s) => s.resetMatch);

  const won = winnerId === user?.id;
  const tied = winnerId === null;

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-lg rounded-[32px] bg-panel p-10 text-center">
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
          className="mt-8 w-full rounded-full bg-red-400 py-5 font-medium text-black"
          onClick={() => {
            resetMatch();
            navigate("/arena");
          }}
        >
          Back to arena
        </button>
      </div>
    </div>
  );
}
