import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GAME_MODE_COPY,
  GAME_MODES_BY_TYPE,
  GameType,
  resolveGameMode,
} from "@quickmath/common";
import { cn } from "@/lib/utils";
import { OnlineUsers } from "@/components/online-users";
import { IconBrain, IconBulbFilled, IconMathXDivideY, IconPuzzleFilled } from "@tabler/icons-react";
import { NavStats } from "@/components/nav-stats";

const CATEGORIES = [
  {
    id: GameType.MATHS,
    label: "Maths",
    icon: <IconMathXDivideY />,
    active: "bg-red-400 ring-red-400",
    hoverText: "hover:text-red-400",
    text: "text-red-400",
    modeRing: "hover:ring-4 hover:ring-red-400",
  },
  {
    id: GameType.MEMORY,
    label: "Memory",
    icon: <IconBrain />,
    active: "bg-green-400 ring-green-400",
    hoverText: "hover:text-green-400",
    text: "text-green-400",
    modeRing: "hover:ring-4 hover:ring-green-400",
  },
  {
    id: GameType.PUZZLE,
    label: "Puzzle",
    icon: <IconPuzzleFilled />,
    active: "bg-blue-400 ring-blue-400",
    hoverText: "hover:text-blue-400",
    text: "text-blue-400",
    modeRing: "hover:ring-4 hover:ring-blue-400",
  },
  {
    id: GameType.LOGIC,
    label: "Logic",
    icon: <IconBulbFilled />,
    active: "bg-yellow-400 ring-yellow-400",
    hoverText: "hover:text-yellow-400",
    text: "text-yellow-400",
    modeRing: "hover:ring-4 hover:ring-yellow-400",
  },
] as const;

export function ArenaPage() {
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<(typeof GameType)[keyof typeof GameType]>(
    GameType.MATHS,
  );

  const selected = CATEGORIES.find((category) => category.id === selectedType) ?? CATEGORIES[0];
  const modes = GAME_MODES_BY_TYPE[selectedType];

  function play(gameType: typeof selectedType, gameMode?: string) {
    const mode = resolveGameMode(gameType, gameMode);
    navigate(`/play/${gameType}/${mode}`);
  }

  return (
    <div className="grid min-h-dvh grid-cols-6 bg- px-8 py-6">
      <div className="col-span-4 min-w-0 px-16">
        <OnlineUsers />
        <p className="mt-8 mb-3 px-2 text-xs font-medium text-muted-foreground">
          GAME
        </p>
        <div className="grid grid-cols-4 gap-3 p-1">
          {CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setSelectedType(category.id)}
              className={cn(
                "group relative grid h-22 w-full shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[14px] border text-center",
                selectedType === category.id
                  ? `border-4 border-background text-black ring-1 ${category.active}`
                  : `border-white/8 bg-panel text-white/15 ${category.hoverText}`,
              )}
            >
              <div>
                <span
                  className={cn(
                    "absolute top-3 left-1/2 -translate-x-1/2 transition-all duration-300 group-hover:scale-0",
                    selectedType === category.id ? "scale-0" : "",
                  )}
                >
                  {category.icon}
                </span>
                <p
                  className={cn(
                    "font-display absolute -bottom-4 left-1/2 -translate-x-1/2 text-5xl font-bold tracking-wide uppercase transition-all duration-300 group-hover:-translate-y-7",
                    selectedType === category.id ? "-translate-y-7" : "translate-y-0",
                  )}
                >
                  {category.label}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div
          className={cn(
            "mt-5 grid gap-4",
            modes.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
          )}
        >
          {modes.map((mode) => {
            const copy = GAME_MODE_COPY[mode];
            return (
              <button
                key={mode}
                type="button"
                onClick={() => play(selectedType, mode)}
                className={cn(
                  "group cursor-pointer rounded-3xl bg-secondary p-5 text-left press-feedback transition-all duration-300 sm:p-6 flex justify-between flex-col",
                  selected.modeRing,
                )}
              >
                <p className={cn("text-sm font-medium", selected.text)}>
                  {selected.label.toUpperCase()}
                </p>
                <h3 className="mt-6 font-display text-4xl font-bold tracking-tighter sm:mt-10 sm:text-5xl">
                  {copy.lines[0]}
                  <br />
                  {copy.lines[1]}
                </h3>
                <p className="mt-4 text-sm text-muted-foreground sm:mt-6">{copy.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      <NavStats selected={selected} />
    </div>
  );
}
