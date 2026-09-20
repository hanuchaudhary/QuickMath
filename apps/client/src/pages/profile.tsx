import { useEffect, useState } from "react";
import { http, ApiError } from "@/lib/http";
import { useAuthStore } from "@/stores/auth.store";
import { UserAvatar } from "@/components/user-avatar";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, totalScore: 0 });
  const [games, setGames] = useState<
    Awaited<ReturnType<typeof http.listGames>>["games"]
  >([]);

  useEffect(() => {
    void http.myStats().then((res) => setStats(res.stats)).catch(() => undefined);
    void http.listGames().then((res) => setGames(res.games)).catch(() => undefined);
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const { user: next } = await http.updateMe({ username, avatar });
      setUser(next);
      setMessage("Saved");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="flex items-center gap-4">
        <UserAvatar name={username || "You"} src={avatar || undefined} size="lg" />
        <div>
          <h1 className="font-display text-4xl font-semibold">{user?.username}</h1>
          <p className="text-sm text-white/40">{user?.email}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat label="Games" value={stats.gamesPlayed} />
        <Stat label="Wins" value={stats.wins} />
        <Stat label="Score" value={stats.totalScore} />
      </div>

      <form onSubmit={save} className="mt-8 rounded-[28px] bg-panel p-6">
        <label className="block text-xs font-semibold tracking-wide text-white/40 uppercase">
          Username
          <input
            className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-lime/50"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs font-semibold tracking-wide text-white/40 uppercase">
          Avatar URL
          <input
            className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-lime/50"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </label>
        <div className="mt-5 flex gap-3">
          <button className="rounded-2xl bg-lime px-5 py-2 text-sm font-bold text-black" type="submit">
            Save
          </button>
          <button
            className="rounded-2xl bg-white/8 px-5 py-2 text-sm"
            type="button"
            onClick={() => logout()}
          >
            Log out
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-white/50">{message}</p> : null}
      </form>

      <h2 className="mt-10 font-display text-2xl">Match history</h2>
      <div className="mt-4 space-y-3">
        {games.map((game) => (
          <div key={game.id} className="flex items-center justify-between rounded-2xl bg-panel px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                {game.type === "DUELS" ? "Sprint Duels" : "Fastest Fingers"}
              </p>
              <p className="text-xs text-white/40">
                vs {game.opponents.map((o) => o.username).join(", ") || "—"}
              </p>
            </div>
            <p className="font-mono tabular-nums text-lime">{game.score}</p>
          </div>
        ))}
        {games.length === 0 ? (
          <p className="text-sm text-white/40">No matches yet. Jump into a duel.</p>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] bg-panel p-4">
      <p className="text-xs tracking-wide text-white/40 uppercase">{label}</p>
      <p className="mt-1 font-mono text-2xl tabular-nums">{value}</p>
    </div>
  );
}
