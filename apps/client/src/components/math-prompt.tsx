import { parseStackedPrompt } from "@/lib/math-prompt";

export function MathPrompt({ prompt }: { prompt: string }) {
  const stacked = parseStackedPrompt(prompt);

  if (!stacked) {
    return (
      <p className="font-display text-5xl font-semibold tracking-tight text-white">
        {prompt}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 font-display text-5xl font-medium tracking-tight text-white sm:text-6xl">
      <span className="tabular-nums">{stacked.top}</span>
      <span className="flex flex-col items-start leading-none">
        <span className="text-[0.55em] text-white/70">{stacked.operator}</span>
        <span className="tabular-nums">{stacked.bottom}</span>
      </span>
    </div>
  );
}
