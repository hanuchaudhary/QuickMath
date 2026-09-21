export const GameType = {
  DUELS: "DUELS",
  FASTEST_FINGER_FIRST: "FASTEST_FINGER_FIRST",
} as const;

export type GameType = (typeof GameType)[keyof typeof GameType];

export type GameDifficulty = "easy" | "medium" | "hard";

export type GameConfig = {
  maxPlayersCount: number;
  questionsCount: number;
  difficulty: GameDifficulty;
  timeLimit: number;
};

export const DEFAULT_GAME_CONFIG_BY_TYPE: Record<GameType, GameConfig> = {
  [GameType.DUELS]: {
    maxPlayersCount: 2,
    questionsCount: 100,
    difficulty: "medium",
    timeLimit: 60, 
  },
  [GameType.FASTEST_FINGER_FIRST]: {
    maxPlayersCount: 2,
    questionsCount: 100,
    difficulty: "medium",
    timeLimit: 260,
  },
};

export function isGameType(value: unknown): value is GameType {
  return (
    typeof value === "string" &&
    Object.values(GameType).includes(value as GameType)
  );
}
