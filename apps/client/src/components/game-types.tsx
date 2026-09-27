import { GameType } from "@quickmath/common";
import { IconBrain, IconBulbFilled, IconMathXDivideY, IconPuzzleFilled } from "@tabler/icons-react";

export const GAME_TYPES = [
  {
    id: GameType.MATHS,
    label: "Maths",
    icon: <IconMathXDivideY />,
    active: "bg-red-400 ring-red-400",
    hoverText: "hover:text-red-400",
    text: "text-red-400",
    ring: "ring-red-400",
    modeRing: "hover:ring-4 hover:ring-red-400",
    locked: false,
  },
  {
    id: GameType.MEMORY,
    label: "Memory",
    icon: <IconBrain />,
    active: "bg-green-400 ring-green-400",
    hoverText: "hover:text-green-400",
    text: "text-green-400",
    ring: "ring-green-400",
    modeRing: "hover:ring-4 hover:ring-green-400",
    locked: false,
  },
  {
    id: GameType.PUZZLE,
    label: "Puzzle",
    icon: <IconPuzzleFilled />,
    active: "bg-blue-400 ring-blue-400",
    hoverText: "hover:text-blue-400",
    text: "text-blue-400",
    ring: "ring-blue-400",
    modeRing: "hover:ring-4 hover:ring-blue-400",
    locked: true,
  },
  {
    id: GameType.LOGIC,
    label: "Logic",
    icon: <IconBulbFilled />,
    active: "bg-yellow-400 ring-yellow-400",
    hoverText: "hover:text-yellow-400",
    text: "text-yellow-400",
    ring: "ring-yellow-400",
    modeRing: "hover:ring-4 hover:ring-yellow-400",
    locked: true,
  },
] as const;

export type GameTypeCard = (typeof GAME_TYPES)[number];
