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
import { IconX } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { ThreeDButton } from "@/components/ui/3d-button";

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
  const opponents = room?.players.filter((p) => p.id !== user?.id);
  const myScore = stats.find((s) => s.userId === me?.id)?.score ?? 0;
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
      <ThreeDButton
        type="button"
        onClick={() => setTapOut(true)}
        className="absolute md:top-6 md:right-6 top-24 bg-red-400 border-red-300 text-secondary cursor-pointer w-fit p-2 md:size-auto size-8 flex items-center justify-center"
      >
        <span className="hidden md:block">
          Tap Out
        </span>
        <span className="block md:hidden">
          <IconX size={16} />
        </span>
      </ThreeDButton>
      <div className="w-full max-w-xl grid grid-cols-3 place-items-center">
        <PlayerHud
          name={me?.username ?? "You"}
          avatar={me?.avatar}
          score={myScore}
          align="left"
          isMe={me?.id === user?.id}
        />
        <div className="rounded-lg bg-background px-4 py-1 font-display text-2xl font-bold tracking-[0.15em] text-white border border-b-4 border-neutral-700 w-fit">
          {minutes}:{seconds}
        </div>
        <div className="flex items-center -space-x-6">
          {opponents && opponents.length > 0 && (
            opponents.slice(0, 3).map((opponent) => (
              <PlayerHud
                multiple={opponents.length > 1}
                key={opponent.id}
                name={opponent.username}
                avatar={opponent.avatar}
                score={stats.find((s) => s.userId === opponent.id)?.score ?? 0}
                align="left"
                isMe={false}
              />
            ))
          )}
        </div>
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
          <Input
            autoFocus
            value={value}
            placeholder="TYPE YOUR ANSWER"
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d-]/g, "");
              setValue(next);
              submitIfCorrect(next);
            }}
            className={cn(
              "h-14 w-full rounded-lg border border-b-4 border-neutral-700 bg-background px-4 font-display text-2xl font-bold tracking-[0.15em] text-white outline-none placeholder:text-muted-foreground focus:border-emerald-400 placeholder:text-center text-center",
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
  multiple,
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
  multiple?: boolean;
}) {
  return (
    <div className={cn("flex relative items-center gap-3", align === "right" && "flex-row-reverse")}>
      <UserAvatar className={cn("ring-4", isMe && "ring-red-400")} name={name} src={avatar || undefined} />
      {!multiple && (
        <div className={cn(align === "right" && "text-right")}>
          <p className="max-w-[90px] truncate text-sm font-semibold">{name}{isMe && " (You)"}</p>
          <div className="bg-secondary size-6 flex items-center justify-center rounded-full text-xs font-semibold font-display border">
            {score}
          </div>
        </div>)}
      {multiple && (
        <div className="flex items-center gap-2">
          {
            isMe && (
              <p className="max-w-[90px] truncate text-sm font-semibold">{name}{isMe && " (You)"}</p>
            )
          }
          <div className="bg-secondary absolute top-0 -left-1 size-6 flex items-center justify-center rounded-full text-xs font-semibold font-display border">
            {score}
          </div>
        </div>
      )}
    </div>
  );
}
