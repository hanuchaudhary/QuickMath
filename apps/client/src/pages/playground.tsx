import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MathPrompt } from "@/components/math-prompt";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";
import { evaluatePrompt } from "@/lib/math-prompt";
import { cn } from "@/lib/utils";

export function PlaygroundPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const room = useGameStore((s) => s.room);
  const question = useGameStore((s) => s.question);
  const stats = useGameStore((s) => s.stats);
  const lastShakeAt = useGameStore((s) => s.lastShakeAt);
  const answer = useGameStore((s) => s.answer);
  const [value, setValue] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setValue("");
  }, [question?.id]);

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
    if (!question) return null;
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

  if (!room || room.id !== roomId) {
    return (
      <div className="grid min-h-dvh place-items-center text-white/40">
        <button type="button" onClick={() => navigate("/")}>
          Return to arena
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center px-6 pt-10">
      <div className="flex w-full max-w-xl items-start justify-between">
        <PlayerHud
          name={me?.username ?? "You"}
          avatar={me?.avatar}
          score={myScore}
          align="left"
        />
        <div className="rounded-full bg-[#123] px-4 py-1 font-mono text-lg tabular-nums text-cyan shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          {minutes}:{seconds}
        </div>
        <PlayerHud
          name={opponent?.username ?? "Waiting"}
          avatar={opponent?.avatar}
          score={theirScore}
          align="right"
        />
      </div>

      <div className="relative mt-16 grid h-[320px] w-full max-w-lg place-items-center">
        <div className="play-grid absolute inset-0" />
        {question ? <MathPrompt prompt={question.prompt} /> : (
          <p className="text-white/40">Get ready...</p>
        )}
      </div>

      <div className="mt-auto mb-16 w-full max-w-md text-center">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-white/35">
          TYPE OUT YOUR ANSWER
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
    </div>
  );
}

function PlayerHud({
  name,
  avatar,
  score,
  align,
}: {
  name: string;
  avatar?: string;
  score: number;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex items-center gap-3", align === "right" && "flex-row-reverse")}>
      <UserAvatar name={name} src={avatar || undefined} />
      <div className={cn(align === "right" && "text-right")}>
        <p className="max-w-[90px] truncate text-sm font-semibold">{name}</p>
        <div className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs tabular-nums">
          {score}
        </div>
      </div>
    </div>
  );
}
