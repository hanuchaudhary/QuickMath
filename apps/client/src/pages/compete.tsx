import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BackButton } from "@/components/ui/back";
import { ThreeDButton } from "@/components/ui/3d-button";
import { Input } from "@/components/ui/input";

export function CompetePage() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  function handleJoinRoom() {
    const code = roomCode.trim().toUpperCase();

    if (!code) return;

    navigate(
      `/compete/join?joinCode=${encodeURIComponent(code)}`,
    );
  }

  return (
    <div className="min-h-dvh bg-background px-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col justify-center">
        <div className="mb-10">
          <BackButton
            to="/arena"
            className="mb-6"
          />

          <h1 className="mt-1 font-display text-5xl font-bold">
            Play Together
          </h1>

          <p className="mt-3 max-w-lg text-base text-muted-foreground">
            Create a private room or join a friend using
            their room code.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-secondary p-6 border-neutral-700">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-400 text-secondary border border-b-4 border-red-300">
              <Plus className="size-6 stroke-2" />
            </div>

            <h2 className="mt-6 font-display text-3xl font-bold">
              Create Room
            </h2>

            <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
              Create a private game and invite your
              friends with a shareable room code.
            </p>

            <ThreeDButton
              onClick={() =>
                navigate("/compete/create")
              }
              className="mt-6 h-14"
            >
              CREATE ROOM
            </ThreeDButton>
          </div>

          <div className="rounded-3xl bg-secondary p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-400 text-secondary border border-b-4 border-emerald-300">
              <Users className="size-6 stroke-2" />
            </div>

            <h2 className="mt-6 font-display text-3xl font-bold">
              Join Room
            </h2>

            <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
              Enter a friend's room code and jump
              straight into their lobby.
            </p>

            <div className="mt-6 flex gap-2">
              <Input
                placeholder="CODE"
                value={roomCode}
                className="w-full"
                maxLength={6}
                onChange={(e) =>
                  setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinRoom();
                  }
                }}
              />

              <ThreeDButton
                onClick={handleJoinRoom}
                disabled={roomCode.length === 0}
                className="h-14 rounded-lg border border-b-4 border-emerald-300 bg-emerald-400 px-5 font-display font-bold text-secondary transition-all hover:bg-emerald-300 disabled:bg-white/5 disabled:text-white/30 disabled:border-white/5 w-fit"
              >
                JOIN
              </ThreeDButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}