import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GameMode, GameType } from "@quickmath/common";
import { MathPrompt } from "@/components/math-prompt";
import { FlashAnzanBoard, MindSnapBoard } from "@/components/memory-play";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";
import { evaluatePrompt } from "@/lib/math-prompt";
import { cn } from "@/lib/utils";
import { arenaPath, readGameQuery } from "@/lib/game-params";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function PlaygroundPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { type, mode } = readGameQuery(location.search);
  const { user } = useAuthStore();
  const { room, connected, hydrated, pendingResume, forfeit } = useGameStore();
  const { question, stats, lastShakeAt, answer } = useGameStore();
  const [value, setValue] = useState("");
  const [now, setNow] = useState(Date.now());
  const [tapOut, setTapOut] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setValue("");
  }, [question?.id, question?.phase]);

  const remaining = useMemo(() => {
    if (!room?.endedAt) return room?.gameConfig.timeLimit ?? 0;
    return Math.max(0, Math.ceil((room.endedAt - now) / 1000));
  }, [now, room]);

  const me = room?.players.find((p) => p.id === user?.id) ?? room?.players[0];
  const opponent = room?.players.find((p) => p.id !== user?.id);
  const myScore = stats.find((s) => s.userId === me?.id)?.score ?? 0;
  const theirScore = stats.find((s) => s.userId === opponent?.id)?.score ?? 0;
  const minutes = String(Math.floor(remaining / 60));
  const seconds = String(remaining % 60).padStart(2, "0");

  function expectedAnswer() {
    if (question?.answer !== undefined) return question.answer;
    if (!question?.prompt) return null;
    return evaluatePrompt(question.prompt);
  }

  function submitIfCorrect(raw: string) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || raw.trim() === "") return;
    const expected = expectedAnswer();
    if (expected === null || parsed !== expected) return;
    answer(parsed);
    setValue("");
  }

  if (pendingResume) {
    return (
      <div className="grid min-h-dvh place-items-center font-display text-2xl text-white/40">
        Duel paused
      </div>
    );
  }

  if (!hydrated || !connected) {
    return (
      <div className="grid min-h-dvh place-items-center text-white/40 font-display text-2xl">
        Reconnecting...
      </div>
    );
  }

  if (!room || room.id !== roomId) {
    return (
      <div className="grid min-h-dvh place-items-center text-white/40">
        <button className="bg-red-400 px-4 py-2 rounded-md font-display text-background text-3xl ring-3 ring-red-400 border-4 border-background" type="button" onClick={() => navigate(arenaPath(type, mode))}>
          Return to arena
        </button>
      </div>
    );
  }

  const memory = room.gameType === GameType.MEMORY;

  return (
    <div className="relative flex min-h-dvh flex-col items-center px-6 pt-10">
      <button
        type="button"
        onClick={() => setTapOut(true)}
        className="absolute top-6 right-6 rounded-full border border-red-400/40 bg-red-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400"
      >
        Tap Out
      </button>
      <div className="flex w-full max-w-xl items-start justify-between">
        <PlayerHud
          name={me?.username ?? "You"}
          avatar={me?.avatar}
          score={myScore}
          align="left"
          isMe={me?.id === user?.id}
        />
        <div className="rounded-full bg-[#123] px-4 py-1 font-mono text-lg tabular-nums text-cyan shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          {minutes}:{seconds}
        </div>
        <PlayerHud
          name={opponent?.username ?? "Waiting"}
          avatar={opponent?.avatar}
          score={theirScore}
          align="right"
          isMe={false}
        />
      </div>

      <div className="relative mt-16 grid min-h-[320px] w-full max-w-lg place-items-center">
        <div className="play-grid pointer-events-none absolute inset-0" />
        {question && memory && room.gameMode === GameMode.MIND_SNAP_DUEL ? (
          <MindSnapBoard
            question={question}
            onSubmit={(cells) => answer(cells)}
            shake={Boolean(lastShakeAt)}
          />
        ) : question && memory && room.gameMode === GameMode.FLASH_ANZAN_DUEL ? (
          <FlashAnzanBoard
            question={question}
            value={value}
            onChange={setValue}
            onSubmit={(n) => {
              answer(n);
              setValue("");
            }}
          />
        ) : question ? (
          <MathPrompt prompt={question.prompt ?? ""} />
        ) : (
          <p className="text-white/40">Get ready...</p>
        )}
      </div>

      {!memory ? (
        <div className="mt-auto mb-16 w-full max-w-md text-center">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            TYPE YOUR ANSWER
          </p>
          <input
            autoFocus
            value={value}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d-]/g, "");
              setValue(next);
              submitIfCorrect(next);
            }}
            className={cn(
              "h-14 w-full rounded-2xl border border-white/10 bg-[#2a2a2a] text-center font-mono text-2xl tabular-nums outline-none focus:border-white/25",
              lastShakeAt ? "shake" : "",
            )}
            key={lastShakeAt}
          />
        </div>
      ) : (
        <div className="mt-auto mb-16" />
      )}
      <ConfirmDialog
        open={tapOut}
        eyebrow="BAIL"
        title="TAP OUT?"
        body="Walk away now and your rival takes the win."
        confirmLabel="Tap out"
        cancelLabel="Stay in"
        onClose={() => setTapOut(false)}
        onConfirm={() => {
          setTapOut(false);
          forfeit();
        }}
      />
    </div>
  );
}

function PlayerHud({
  name,
  avatar,
  score,
  align,
  isMe,
}: {
  name: string;
  avatar?: string;
  score: number;
  align: "left" | "right";
  isMe: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", align === "right" && "flex-row-reverse")}>
      <div className={cn("ring-4 rounded-3xl p-2", isMe ? "ring-red-400" : "ring-white/10")}>
        <UserAvatar name={name} src={avatar || undefined} />
      </div>
      <div className={cn(align === "right" && "text-right")}>
        <p className="max-w-[90px] truncate text-sm font-semibold">{name}</p>
        <div className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs tabular-nums">
          {score}
        </div>
      </div>
    </div>
  );
}
