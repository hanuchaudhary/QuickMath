import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function CompetePage() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  function handleJoinRoom() {
    const code = roomCode.trim().toUpperCase();

    if (!code) return;

    navigate(`/compete/join?joinCode=${encodeURIComponent(code)}`);
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="flex w-full max-w-sm flex-col rounded-lg border bg-secondary p-4">
        <h2 className="text-3xl font-bold">
          Create Room
        </h2>

        <p className="text-sm font-medium text-foreground/80">
          Create a room to compete with other players.
        </p>

        <Button
          className="mt-4 w-full"
          onClick={() => navigate("/compete/create")}
        >
          Create Room
        </Button>
      </div>

      <div className="flex w-full max-w-sm flex-col rounded-lg border bg-secondary p-4">
        <h2 className="text-3xl font-bold">
          Join Room
        </h2>

        <p className="text-sm font-medium text-foreground/80">
          Join a room to compete with other players.
        </p>

        <input
          className="mt-4 w-full rounded-md border bg-background px-3 py-2"
          placeholder="Room Code"
          value={roomCode}
          maxLength={6}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />

        <Button
          className="mt-4 w-full"
          onClick={handleJoinRoom}
        >
          Join Room
        </Button>
      </div>
    </div>
  );
}