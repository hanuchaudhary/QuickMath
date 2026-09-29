import {
  GAME_MODE_COPY,
  type GameMode,
} from "@quickmath/common";
import { cn } from "@/lib/utils";
import type { GameTypeCard } from "@/components/game-types";

export function GameModeCards({
  typeKey,
  modes,
  selected,
  selectedMode,
  onPick,
}: {
  typeKey: string;
  modes: readonly GameMode[];
  selected: GameTypeCard;
  selectedMode?: GameMode;
  onPick?: (mode: GameMode) => void;
}) {
  return (
    <div
      key={typeKey}
      className={cn(
        "mt-5 grid gap-4",
        modes.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
      )}
    >
      {modes.map((mode, index) => {
        const copy = GAME_MODE_COPY[mode];
        return (
          <button
            key={mode}
            type="button"
            onClick={() => !selected.locked && onPick?.(mode)}
            style={{ animationDelay: `${index * 80}ms` }}
            className={cn(
              "mode-in group cursor-pointer group rounded-3xl bg-secondary p-5 text-left press-feedback transition-all duration-300 sm:p-6 flex justify-between flex-col",
              selectedMode === mode ? `ring-4 ${selected.ring}` : selected.modeRing,
            )}
          >
            {!selected.locked ? (
              <>
                <p className={cn("text-xs font-semibold", selected.text)}>
                  {selected.label.toUpperCase()}
                </p>
                <h3 className="mt-6 font-display text-4xl font-bold tracking-tighter sm:mt-10 sm:text-5xl">
                  <span className={cn("inline-block transition-colors duration-300", `group-hover:${selected.text}`)}>
                    {copy.lines[0]}
                  </span>
                  <br />
                  {copy.lines[1]}
                </h3>
                <p className="mt-4 sm:mt-6 subheading">
                  {copy.blurb}
                </p>
              </>
            ) : (
              <div>
                <p className="font-display text-4xl font-bold tracking-tighter">
                  COMING <span className={selected.text}>SOON</span>
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
