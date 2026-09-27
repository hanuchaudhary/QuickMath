import { useEffect, useState } from "react";
import { type PublicQuestion } from "@quickmath/common";
import { cn } from "@/lib/utils";

export function MindSnapBoard({
  question,
  onSubmit,
  shake,
}: {
  question: PublicQuestion;
  onSubmit: (cells: number[]) => void;
  shake: boolean;
}) {
  const size = question.grid?.size ?? 4;
  const revealed = new Set(question.grid?.cells ?? []);
  const targetCount = question.grid?.targetCount ?? revealed.size;
  const isMemorize = question.phase === "memorize";
  const [picked, setPicked] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setPicked([]);
    setLocked(false);
  }, [question.id, question.phase]);

  function toggle(id: number) {
    if (isMemorize || locked) return;
    setPicked((current) => {
      if (current.includes(id)) {
        return current.filter((cell) => cell !== id);
      }
      if (targetCount > 0 && current.length >= targetCount) {
        return current;
      }
      const next = [...current, id];
      if (targetCount > 0 && next.length === targetCount) {
        setLocked(true);
        window.setTimeout(() => onSubmit(next), 0);
      }
      return next;
    });
  }

  return (
    <div className="relative z-10 flex flex-col items-center gap-4">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-green-400">
        {isMemorize
          ? "Hold the pattern"
          : locked
            ? "Locked in"
            : `Light ${targetCount} ${targetCount === 1 ? "cell" : "cells"}`}
      </p>
      <div
        className={cn("grid gap-2", shake && "shake")}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, id) => {
          const lit = isMemorize ? revealed.has(id) : picked.includes(id);
          return (
            <button
              key={id}
              type="button"
              disabled={isMemorize || locked}
              onClick={() => toggle(id)}
              className={cn(
                "size-14 rounded-xl border transition sm:size-16",
                lit
                  ? "border-green-300 bg-green-400 shadow-[0_0_24px_rgba(74,222,128,0.45)]"
                  : "border-white/10 bg-[#1f1f1f] hover:border-white/25",
                isMemorize && "cursor-default",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function FlashAnzanBoard({
  question,
  value,
  onChange,
  onSubmit,
}: {
  question: PublicQuestion;
  value: string;
  onChange: (next: string) => void;
  onSubmit: (n: number) => void;
}) {
  const [shown, setShown] = useState<number | null>(null);
  const flashing = question.phase === "flash";

  useEffect(() => {
    if (!flashing || !question.sequence?.length) {
      setShown(null);
      return;
    }
    const sequence = question.sequence;
    const total = Math.max((question.phaseEndsAt ?? Date.now()) - Date.now(), 1);
    const step = total / sequence.length;
    let i = 0;
    setShown(sequence[0] ?? null);
    const timer = window.setInterval(() => {
      i += 1;
      if (i >= sequence.length) {
        window.clearInterval(timer);
        setShown(null);
        return;
      }
      setShown(sequence[i]!);
    }, step);
    return () => window.clearInterval(timer);
  }, [flashing, question.id, question.phaseEndsAt, question.sequence]);

  if (flashing) {
    return (
      <div className="relative z-10 grid h-[280px] place-items-center">
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-green-400">
          Add them up
        </p>
        <p
          key={shown}
          className="font-display text-8xl tabular-nums text-white pop-in"
        >
          {shown ?? ""}
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-green-400">
        Sum
      </p>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, ""))}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const parsed = Number(value);
          if (!Number.isFinite(parsed) || value.trim() === "") return;
          onSubmit(parsed);
        }}
        className="h-14 w-full rounded-2xl border border-white/10 bg-[#2a2a2a] text-center font-mono text-2xl tabular-nums outline-none focus:border-green-400/40"
      />
    </div>
  );
}
