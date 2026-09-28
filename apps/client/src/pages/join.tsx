import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";

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
    <div className="min-h-dvh bg-background px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-secondary p-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-white/40">
                PRIVATE ROOM
              </p>

              <h1 className="mt-2 text-2xl font-bold">
                {room.gameType}
              </h1>
            </div>

            {isHost && !isStarting && (
              <button
                onClick={() =>
                  stopCustomRoom(room.id)
                }
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-400/20"
              >
                STOP ROOM
              </button>
            )}
          </div>

          {/* Room Code */}
          <div className="mt-8 text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-white/40">
              ROOM CODE
            </p>

            <button
              onClick={copyCode}
              disabled={isStarting}
              className="mt-2 rounded-xl px-4 py-2 transition hover:bg-white/5 disabled:pointer-events-none"
            >
              <p className="font-display text-6xl font-bold tracking-widest">
                {copiedCode
                  ? "COPIED!"
                  : room.joinCode}
              </p>
            </button>

            <p className="mt-2 text-sm text-white/40">
              {room.players.length}/
              {room.gameConfig.maxPlayersCount} players
            </p>

            <button
              onClick={copyLink}
              disabled={isStarting}
              className="mt-5 rounded-xl bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {copiedLink
                ? "COPIED!"
                : "COPY LINK"}
            </button>
          </div>

          {/* Game Info */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              {room.gameType}
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              {room.gameMode}
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              {room.gameConfig.timeLimit}s
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              {room.gameConfig.difficulty}
            </span>
          </div>
        </div>

        {/* Players */}
        <div className="mt-5 space-y-2">
          {room.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-secondary p-4"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={player.username}
                  src={player.avatar}
                  size="md"
                />

                <span>
                  {player.id === user?.id
                    ? "You"
                    : player.username}
                </span>
              </div>

              {player.id === room.hostId && (
                <span className="rounded-md border border-green-400 px-2 py-1 text-xs text-green-400">
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="mt-8">
          {isStarting ? (
            <div className="flex h-20 items-center justify-center rounded-2xl bg-white/5">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  Game starting
                </p>

                <p className="mt-1 text-4xl font-black text-red-400">
                  {countdown ?? 1}
                </p>
              </div>
            </div>
          ) : isHost ? (
            <button
              disabled={room.players.length < 2}
              onClick={handleStart}
              className="w-full rounded-2xl bg-green-500 py-4 font-bold text-black transition hover:bg-green-400 disabled:bg-white/5 disabled:text-white/30"
            >
              {room.players.length < 2
                ? "NEED 2 PLAYERS"
                : "START GAME"}
            </button>
          ) : (
            <div className="rounded-2xl bg-white/5 py-4 text-center text-sm text-white/40">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}