import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { gameTitle, isGameType, resolveGameMode } from "@quickmath/common";
import { useAuthStore } from "@/stores/auth.store";
import { UserAvatar } from "@/components/user-avatar";
import { NavStats } from "@/components/nav-stats";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ApiError, http } from "@/lib/http";

export function ProfilePage() {
  const { username: routeName } = useParams();
  const navigate = useNavigate();
  const { user: me, setUser, logout } = useAuthStore();

  const [profile, setProfile] = useState<{
    id: string;
    username: string;
    avatar: string;
    email?: string;
  } | null>(null);
  const [avatar, setAvatar] = useState("");
  const [message, setMessage] = useState("");
  const [missing, setMissing] = useState(false);
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, totalScore: 0 });
  const [games, setGames] = useState<
    Awaited<ReturnType<typeof http.getProfile>>["games"]
  >([]);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isOwner = Boolean(me && profile && me.id === profile.id);

  useEffect(() => {
    if (!routeName) return;
    setMissing(false);
    setMessage("");
    void http
      .getProfile(routeName)
      .then((res) => {
        setProfile(res.user);
        setAvatar(res.user.avatar);
        setStats(res.stats);
        setGames(res.games);
      })
      .catch(() => {
        setProfile(null);
        setMissing(true);
      });
  }, [routeName]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!isOwner) return;
    setMessage("");
    try {
      const { user: next } = await http.updateMe({ avatar });
      setUser(next);
      setProfile({ ...next });
      setMessage("Saved");
      if (next.username !== routeName) {
        navigate(`/profile/${next.username}`, { replace: true });
      }
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-6 px-8 py-6">
      <div className="col-span-4 min-w-0 px-16">
        {missing ? (
          <div className="mt-10 rounded-3xl bg-secondary p-8">
            <p className="text-sm font-medium text-red-400">PROFILE</p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tighter">
              PLAYER
              <br />
              NOT FOUND
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              No one in QuickMath uses that handle.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-end justify-between gap-6">
              <div className="flex items-center gap-5">
                <UserAvatar
                  name={profile?.username ?? routeName ?? "Player"}
                  src={profile?.avatar || undefined}
                  size="lg"
                />
                <div>
                  {
                    !isOwner &&
                    <p className="text-sm font-medium text-red-400">PLAYER</p>
                  }
                  <h1 className="font-display text-5xl font-bold tracking-tighter sm:text-6xl">
                    {profile?.username ?? routeName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isOwner && profile?.email ? profile.email : `@${profile?.username ?? routeName}`}
                  </p>
                </div>
              </div>
              {isOwner ? (
                <button
                  type="button"
                  className="rounded-2xl bg-white/8 px-5 py-2 text-sm"
                  onClick={() => setConfirmLogout(true)}
                >
                  Log out
                </button>
              ) : (
                <Link
                  to="/arena"
                  className="rounded-2xl bg-white/8 px-5 py-2 text-sm"
                >
                  Challenge
                </Link>
              )}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat label="Games" value={stats.gamesPlayed} />
              <Stat label="Wins" value={stats.wins} />
              <Stat label="Score" value={stats.totalScore} />
            </div>

            {isOwner ? (
              <form onSubmit={save} className="mt-5 rounded-3xl bg-secondary p-6">
                <label className="mt-4 block text-xs font-semibold tracking-wide text-white/40 uppercase">
                  Avatar URL
                  <input
                    className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-red-400/50"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                </label>
                <button
                  className="mt-5 rounded-2xl bg-red-400 px-5 py-2 text-sm font-bold text-black"
                  type="submit"
                >
                  Save
                </button>
                {message ? <p className="mt-3 text-sm text-white/50">{message}</p> : null}
              </form>
            ) : null}

            <p className="mt-8 mb-3 px-2 text-xs font-medium text-muted-foreground">
              MATCH HISTORY
            </p>
            <div className="space-y-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between rounded-3xl bg-secondary px-5 py-4"
                >
                  <div>
                    <p className="font-display text-2xl tracking-tight">
                      {isGameType(game.type)
                        ? gameTitle(game.type, resolveGameMode(game.type, game.mode))
                        : game.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      vs {game.opponents.map((o) => o.username).join(", ") || "—"}
                    </p>
                  </div>
                  <p className="font-mono text-xl tabular-nums text-red-400">{game.score}</p>
                </div>
              ))}
              {games.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches yet.</p>
              ) : null}
            </div>
          </>
        )}
      </div>

      <NavStats selected={{ text: "text-red-400" }} />
      <ConfirmDialog
        open={confirmLogout}
        title="LOG OUT?"
        body="You'll need to sign in again to keep playing."
        confirmLabel="Log out"
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void logout();
        }}
      />
    </div >
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <p className="text-xs tracking-wide text-white/40 uppercase">{label}</p>
      <p className="mt-2 font-display text-4xl tracking-tighter">{value}</p>
    </div>
  );
}
