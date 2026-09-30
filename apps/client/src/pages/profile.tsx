import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameMode, gameTitle, GameType, isGameType, resolveGameMode, type CreateCustomRoomSchema } from "@quickmath/common";
import { useAuthStore } from "@/stores/auth.store";
import { UserAvatar } from "@/components/user-avatar";
import { NavStats } from "@/components/nav-stats";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { http } from "@/lib/http";
import { ThreeDButton } from "@/components/ui/3d-button";
import { useGameStore } from "@/stores/game.store";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import RoomForm from "./room-form";
import { toast } from "sonner";

export function ProfilePage() {
  const { username: routeName } = useParams();
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
                <div className="flex items-center gap-2">
                  <ChallengeFormDialog challengedId={profile?.id!} challengedUsername={profile?.username!} />
                </div>
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

const ChallengeFormDialog = ({ challengedId, challengedUsername }: { challengedId: string, challengedUsername: string }) => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<CreateCustomRoomSchema>({
    gameType: GameType.MATHS,
    gameMode: GameMode.DUEL,
    gameConfig: {
      difficulty: "medium",
      timeLimit: 2,
      maxPlayers: 2,
    },
  });

  const { connected, challengeUser } = useGameStore();
  const navigate = useNavigate();

  const handleGameTypeChange = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      gameType: value as GameType,
    }));
  }

  const handleChallenge = () => {
    if (!challengedId) return;
    if (connected) {
      challengeUser(challengedId, config.gameType, config.gameMode);
      toast.success(`Challenge sent to ${challengedUsername}`);
      setOpen(false);
    } else {
      navigate("/arena");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <span
          className="px-6 py-2 rounded-lg bg-neutral-200 border-neutral-400 hover:bg-white hover:border-neutral-400 border border-b-4 font-display text-xl font-semibold text-secondary transition-all cursor-pointer active:border-b-0 active:translate-y-0.5 active:scale-95"
        >
          Challenge
        </span>
      </DialogTrigger>
      <DialogContent className={"border border-b-6 md:min-w-2xl"} showCloseButton={false}>
        <div>
          <h2 className="font-display text-3xl font-bold">
            Challenge <span className="text-red-400">{challengedUsername}</span>
          </h2>
          <p className="subheading text-xs! font-semibold!">
            Choose the game mode and difficulty you want to play.
          </p>
        </div>
        <RoomForm handleGameTypeChange={handleGameTypeChange} config={config} setConfig={setConfig} />
        <ThreeDButton
          type="button"
          variant="secondary"
          className="w-full py-2 "
          onClick={handleChallenge}
        >
          Challenge
        </ThreeDButton>
      </DialogContent>
    </Dialog>
  )
}