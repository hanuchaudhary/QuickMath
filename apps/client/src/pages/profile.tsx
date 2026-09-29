import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gameTitle, isGameType, resolveGameMode } from "@quickmath/common";
import { useAuthStore } from "@/stores/auth.store";
import { UserAvatar } from "@/components/user-avatar";
import { NavStats } from "@/components/nav-stats";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { http } from "@/lib/http";
import { ThreeDButton } from "@/components/ui/3d-button";
import { useGameStore } from "@/stores/game.store";

export function ProfilePage() {
  const { username: routeName } = useParams();
  const navigate = useNavigate();
  const { user: me, logout } = useAuthStore();

  const [profile, setProfile] = useState<{
    id: string;
    username: string;
    avatar?: string;
    email?: string;
  } | null>(null);
  const [missing, setMissing] = useState(false);
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, totalScore: 0 });
  const [games, setGames] = useState<
    Awaited<ReturnType<typeof http.getProfile>>["games"]
  >([]);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { connected, challengeUser } = useGameStore()

  const isOwner = Boolean(me && profile && me.id === profile.id);

  useEffect(() => {
    if (!routeName) return;
    setMissing(false);
    void http
      .getProfile(routeName)
      .then((res) => {
        setProfile(res.user);
        setStats(res.stats);
        setGames(res.games);
      })
      .catch(() => {
        setProfile(null);
        setMissing(true);
      });
  }, [routeName]);

  const handleChallenge = () => {
    if (!profile) return;
    if (connected) {
      challengeUser(profile.id, "MATHS", "DUELS");

    } else {
      navigate("/arena");
    }
  }

  return (
    <div className="md:grid min-h-dvh grid-cols-6 md:px-8 py-6">
      <div className="col-span-4 min-w-0 md:px-16 px-4 relative">
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
                    <p className="subheading text-xs! font-semibold text-red-400">PLAYER</p>
                  }
                  <h1 className="font-display text-5xl font-bold tracking-tighter sm:text-6xl">
                    {profile?.username ?? routeName}
                  </h1>
                  <p className="subheading text-xs! font-semibold!">
                    {isOwner && profile?.email ? profile.email : `@${profile?.username ?? routeName}`}
                  </p>
                </div>
              </div>
              {isOwner ? (
                <ThreeDButton
                  type="button"
                  className="bg-neutral-600 border-neutral-500 text-white py-2 w-fit px-10"
                  onClick={() => setConfirmLogout(true)}
                >
                  Log out
                </ThreeDButton>
              ) : (
                <ThreeDButton
                  type="button"
                  className="bg-neutral-600 border-neutral-500 text-white py-2 w-fit px-10"
                  onClick={handleChallenge}
                >
                  Challenge
                </ThreeDButton>
              )}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat label="Games" value={stats.gamesPlayed} />
              <Stat label="Wins" value={stats.wins} />
              <Stat label="Score" value={stats.totalScore} />
            </div>

            <p className="mt-8 mb-3 px-2 subheading text-xs! font-semibold!">
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
                    <p className="subheading text-xs! font-semibold!">
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
      <p className="subheading text-xs! font-semibold!">{label}</p>
      <p className="mt-2 font-display text-4xl tracking-tighter">{value}</p>
    </div>
  );
}
