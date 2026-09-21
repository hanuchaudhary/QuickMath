import { parseStackedPrompt } from "@/lib/math-prompt";
import { cn } from "@/lib/utils";

export function MathPrompt({
  prompt,
  className,
}: {
  prompt: string;
  className?: string;
}) {
  const stacked = parseStackedPrompt(prompt);

  if (!stacked) {
    return (
      <p className={cn("font-display text-5xl font-semibold tracking-tight text-white", className)}>
        {prompt}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex flex-col items-end font-display text-6xl leading-none tracking-tight text-white sm:text-7xl",
        className,
      )}
    >
      <span className="tabular-nums">{stacked.top}</span>
      <span className="mt-2 flex items-baseline gap-3">
        <span className="text-7xl text-white/80">{stacked.operator}</span>
        <span className="tabular-nums">{stacked.bottom}</span>
      </span>
    </div>
  );
}
