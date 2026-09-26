export const GameType = {
  MATHS: "MATHS",
  PUZZLE: "PUZZLE",
  MEMORY: "MEMORY",
  LOGIC: "LOGIC",
} as const;

export type GameType = (typeof GameType)[keyof typeof GameType];

export const GameMode = {
  DEFAULT: "DEFAULT",
  DUEL: "DUEL",
  FASTEST_FINGER_FIRST: "FASTEST_FINGER_FIRST",
} as const;

export type GameMode = (typeof GameMode)[keyof typeof GameMode];

export type GameDifficulty = "easy" | "medium" | "hard";

export type GameConfig = {
  maxPlayersCount: number;
  questionsCount: number;
  difficulty: GameDifficulty;
  timeLimit: number;
};

export const GAME_MODES_BY_TYPE: Record<GameType, GameMode[]> = {
  [GameType.MATHS]: [GameMode.DUEL, GameMode.FASTEST_FINGER_FIRST],
  [GameType.PUZZLE]: [GameMode.DEFAULT],
  [GameType.MEMORY]: [GameMode.DEFAULT],
  [GameType.LOGIC]: [GameMode.DEFAULT],
};

const SHARED_CONFIG: GameConfig = {
  maxPlayersCount: 2,
  questionsCount: 100,
  difficulty: "medium",
  timeLimit: 60,
};

export const DEFAULT_GAME_CONFIG_BY_MODE: Record<GameMode, GameConfig> = {
  [GameMode.DEFAULT]: SHARED_CONFIG,
  [GameMode.DUEL]: SHARED_CONFIG,
  [GameMode.FASTEST_FINGER_FIRST]: {
    ...SHARED_CONFIG,
    timeLimit: 260,
  },
};

export function isGameType(value: unknown): value is GameType {
  return (
    typeof value === "string" &&
    Object.values(GameType).includes(value as GameType)
  );
}

export function isGameMode(value: unknown): value is GameMode {
  return (
    typeof value === "string" &&
    Object.values(GameMode).includes(value as GameMode)
  );
}

export function resolveGameMode(
  gameType: GameType,
  gameMode?: unknown,
): GameMode {
  const allowed = GAME_MODES_BY_TYPE[gameType];
  if (isGameMode(gameMode) && allowed.includes(gameMode)) {
    return gameMode;
  }
  return allowed[0] ?? GameMode.DEFAULT;
}

export function getGameConfig(
  gameType: GameType,
  gameMode?: unknown,
): GameConfig {
  const mode = resolveGameMode(gameType, gameMode);
  return DEFAULT_GAME_CONFIG_BY_MODE[mode];
}

export function gameTitle(gameType: GameType, gameMode: GameMode): string {
  if (gameType === GameType.MATHS && gameMode === GameMode.FASTEST_FINGER_FIRST) {
    return "Fastest Fingers";
  }
  if (gameType === GameType.MATHS && gameMode === GameMode.DUEL) {
    return "Sprint Duels";
  }
  if (gameType === GameType.MEMORY) return "Memory";
  if (gameType === GameType.PUZZLE) return "Puzzle";
  if (gameType === GameType.LOGIC) return "Logic";
  return "Duel";
}
