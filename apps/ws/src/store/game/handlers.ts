import { GameMode, GameType } from "@quickmath/common";
import type { GameModeHandler } from "../../utils/types";
import { FastestFingerFirst } from "./maths/fastest-finger-first";
import { SprintDuel } from "./maths/duel";
import { MindSnapDuel } from "./memory/mind-snap";
import { FlashAnzanDuel } from "./memory/flash-anzan";

const handlers: Partial<
  Record<GameType, Partial<Record<GameMode, GameModeHandler>>>
> = {
  [GameType.MATHS]: {
    [GameMode.DUEL]: new SprintDuel(),
    [GameMode.FASTEST_FINGER_FIRST]: new FastestFingerFirst(),
  },
  [GameType.MEMORY]: {
    [GameMode.MIND_SNAP_DUEL]: new MindSnapDuel(),
    [GameMode.FLASH_ANZAN_DUEL]: new FlashAnzanDuel(),
  },
};

export function getHandler(
  gameType: GameType,
  gameMode: GameMode,
): GameModeHandler | undefined {
  return handlers[gameType]?.[gameMode];
}
