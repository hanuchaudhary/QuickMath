import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";
import { X } from "lucide-react";
import { cn } from "cn";
import { ThreeDButton } from "@/components/ui/3d-button";

export function JoinRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuthStore();

  const {
    socket,
    connected,
    room,
    error,
    startCustomRoom,
    stopCustomRoom,
  } = useGameStore();

  const sentCode = useRef<string | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const params = new URLSearchParams(location.search);
  const joinCode = params.get("joinCode")?.trim().toUpperCase();

  useEffect(() => {
    if (!connected || !socket || !joinCode) {
      return;
    }

    if (
      room?.isPrivate &&
      room.joinCode === joinCode
    ) {
      return;
    }

    if (sentCode.current === joinCode) {
      return;
    }

    sentCode.current = joinCode;

    socket.send(
      JSON.stringify({
        type: "JOIN_CUSTOM_ROOM",
        payload: {
          joinCode,
        },
      }),
    );
  }, [
    connected,
    socket,
    joinCode,
    room?.isPrivate,
    room?.joinCode,
  ]);

  useEffect(() => {
    if (room?.status !== "STARTING") {
      setCountdown(null);
      return;
    }

    setCountdown(3);

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(timer);
          return null;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [room?.status]);

  const copyCode = async () => {
    if (!joinCode) return;

    await navigator.clipboard.writeText(joinCode);

    setCopiedCode(true);

    window.setTimeout(() => {
      setCopiedCode(false);
    }, 1500);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(
      window.location.href,
    );

    setCopiedLink(true);

    window.setTimeout(() => {
      setCopiedLink(false);
    }, 1500);
  };

  const handleStart = () => {
    if (!room || room.players.length < 2) {
      return;
    }

    startCustomRoom(room.id);
  };

  if (!joinCode) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div>
          <p className="text-white/50">
            No room code provided.
          </p>

          <button
            onClick={() => navigate("/compete")}
            className="mt-4 rounded-xl bg-white/10 px-4 py-2"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!room || room.joinCode !== joinCode) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Joining room...
          </p>

          <p className="mt-2 text-sm text-white/40">
            {joinCode}
          </p>

          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const isHost = room.hostId === user?.id;
  const isStarting = room.status === "STARTING";

  return (
    <div className="min-h-dvh bg-background px-6 py-8 text-white relative">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-secondary p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1>
                Configuration:
              </h1>
              <h1 className="text-2xl font-semibold flex flex-wrap gap-2">
                <span>
                  {room.gameType}
                </span>
                <span className="text-muted-foreground">
                  {room.gameMode}
                </span>
                <span>
                  {room.gameConfig.timeLimit / 60}m
                </span>
                <span className="text-muted-foreground">
                  {room.gameConfig.difficulty}
                </span>
                <span>
                  {room.gameConfig.maxPlayersCount} PLAYERS
                </span>
              </h1>
            </div>

            {isHost && !isStarting && (
              <ThreeDButton
                onClick={() => {
                  stopCustomRoom(room.id);
                  setTimeout(() => {
                    navigate("/compete");
                  });
                }}
                className="bg-red-400 border-red-300 text-secondary cursor-pointer w-fit p-2"
              >
                <X className="size-4 stroke-2" />
              </ThreeDButton>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              ROOM CODE
            </p>

            <button
              onClick={copyCode}
              disabled={isStarting}
              className="mt-2 rounded-xl px-4 py-2 transition hover:bg-white/5 disabled:pointer-events-none cursor-pointer"
            >
              <p className="font-display text-6xl font-bold tracking-widest text-red-400">
                {copiedCode
                  ? "COPIED!"
                  : room.joinCode}
              </p>
            </button>

            <p className="mt-2 text-sm text-muted-foreground font-display">
              {room.players.length}/
              {room.gameConfig.maxPlayersCount} players
            </p>

            <ThreeDButton
              onClick={copyLink}
              disabled={isStarting}
              className="mt-5 bg-white border-neutral-400 text-secondary cursor-pointer w-fit p-2 px-6"
            >
              {copiedLink
                ? "COPIED!"
                : "COPY LINK"}
            </ThreeDButton>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {room.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-full border border-white/10 bg-secondary p-2"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={player.username}
                  src={player.avatar}
                  size="md"
                />

                <span className="font-display text-xl">
                  {player.id === user?.id
                    ? "You"
                    : player.username}
                </span>
              </div>

              {player.id === room.hostId && (
                <span className="rounded-full px-5 py-2 text-xl text-secondary bg-emerald-400 font-display">
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 absolute bottom-20 left-1/2 -translate-x-1/2">
          <button
            disabled={room.players.length < 2}
            onClick={handleStart}
            className={cn("w-full border border-b-4 rounded-full bg-emerald-400 py-3 px-8 text-xl font-bold font-display text-secondary transition-all hover:bg-emerald-300 border-emerald-200 hover:border-emerald-100 duration-300 cursor-pointer disabled:pointer-events-none", room.players.length < 2 && "bg-white text-background border-neutral-400", isStarting && "bg-red-400 text-secondary hover:bg-red-300 border-red-300 hover:border-red-200", !isHost && room.players.length === 2 && "bg-blue-400 hover:bg-blue-300 border-blue-200 hover:border-blue-100")}
          >
            {
              isStarting ? (
                <span className="font-display text-6xl font-bold tracking-widest text-secondary">
                  {countdown ?? 1}
                </span>
              ) :
                isHost ?
                  room.players.length < 2
                    ? `NEED ${room.gameConfig.maxPlayersCount - room.players.length} MORE PLAYERS`
                    : "START GAME"
                  : "WAITING FOR HOST TO START"
            }
          </button>
        </div>
      </div>
    </div>
  );
}