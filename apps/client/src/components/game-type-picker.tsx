import { cn } from "@/lib/utils";
import type { GameTypeCard } from "@/components/game-types";

export function GameTypePicker({
  types,
  selectedId,
  onSelect,
}: {
  types: readonly GameTypeCard[];
  selectedId: GameTypeCard["id"];
  onSelect: (id: GameTypeCard["id"]) => void;
}) {
  return (
    <div className="md:grid grid-cols-4 flex overflow-x-auto gap-3 p-1 md:mask-none mask-x-from-95% scrollbar-hide">
      {types.map((category) => (
        <button
          type="button"
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            "group relative grid h-22 md:w-full w-40 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[14px] border text-center",
            selectedId === category.id
              ? `border-4 border-background text-black ring-1 ${category.active}`
              : `border-white/8 bg-panel text-white/15 ${category.hoverText}`,
          )}
        >
          <div>
            <span
              className={cn(
                "absolute top-3 left-1/2 -translate-x-1/2 transition-all duration-300 group-hover:scale-0",
                selectedId === category.id ? "scale-0" : "",
              )}
            >
              {category.icon}
            </span>
            <p
              className={cn(
                "font-display absolute -bottom-4 left-1/2 -translate-x-1/2 text-5xl font-bold tracking-wide uppercase transition-all duration-300 group-hover:-translate-y-7",
                selectedId === category.id ? "-translate-y-7" : "translate-y-0",
              )}
            >
              {category.label}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
