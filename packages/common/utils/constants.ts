export const GameType = {
  MATHS: "MATHS",
  PUZZLE: "PUZZLE",
  MEMORY: "MEMORY",
  LOGIC: "LOGIC",
} as const;

export type GameType = (typeof GameType)[keyof typeof GameType];

export const GameMode = {
  DEFAULT: "DEFAULT",
  DUEL: "DUELS",
  FASTEST_FINGER_FIRST: "FASTEST_FINGER_FIRST",

  // MEMORY
  MIND_SNAP_DUEL: "MIND_SNAP_DUEL",
  FLASH_ANZAN_DUEL: "FLASH_ANZAN_DUEL",

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
  [GameType.MEMORY]: [GameMode.MIND_SNAP_DUEL, GameMode.FLASH_ANZAN_DUEL],
  [GameType.LOGIC]: [GameMode.DEFAULT],
};

export const SHARED_CONFIG: GameConfig = {
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
  [GameMode.MIND_SNAP_DUEL]: {
    ...SHARED_CONFIG,
    timeLimit: 260,
  },
  [GameMode.FLASH_ANZAN_DUEL]: {
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

export const GAME_MODE_COPY: Record<
  GameMode,
  { lines: [string, string]; blurb: string }
> = {
  [GameMode.DEFAULT]: {
    lines: ["DEFAULT", "MODE"],
    blurb: "No extra modes yet. This queue uses the default game mode.",
  },
  [GameMode.DUEL]: {
    lines: ["SPRINT", "DUELS"],
    blurb: "Race to solve the most in 1 minute",
  },
  [GameMode.FASTEST_FINGER_FIRST]: {
    lines: ["FASTEST FINGERS", "DUELS"],
    blurb: "Be the first to answer each question",
  },
  [GameMode.MIND_SNAP_DUEL]: {
    lines: ["MIND SNAP", "DUEL"],
    blurb: "Hold the pattern, then match it before your rival does.",
  },
  [GameMode.FLASH_ANZAN_DUEL]: {
    lines: ["FLASH ANZAN", "DUEL"],
    blurb: "Numbers flash by. Add them up faster than your opponent.",
  },
};

export function gameTitle(gameType: GameType, gameMode: GameMode): string {
  if (gameType === GameType.MATHS && gameMode === GameMode.FASTEST_FINGER_FIRST) {
    return "Fastest Fingers";
  }
  if (gameType === GameType.MATHS && gameMode === GameMode.DUEL) {
    return "Sprint Duels";
  }
  if (gameMode === GameMode.MIND_SNAP_DUEL) return "Mind Snap Duel";
  if (gameMode === GameMode.FLASH_ANZAN_DUEL) return "Flash Anzan Duel";
  if (gameType === GameType.MEMORY) return "Memory";
  if (gameType === GameType.PUZZLE) return "Puzzle";
  if (gameType === GameType.LOGIC) return "Logic";
  return "Duel";
}
