import {
  GAME_MODES_BY_TYPE,
  GameMode,
  GameType,
  isGameMode,
  resolveGameMode,
} from "@quickmath/common";

export const GAME_PARAM: Record<GameType, string> = {
  [GameType.MATHS]: "math",
  [GameType.MEMORY]: "memory",
  [GameType.PUZZLE]: "puzzle",
  [GameType.LOGIC]: "logic",
};

export function parseGameParam(value: string | null): GameType {
  const key = (value ?? "").toLowerCase();
  if (key === "math" || key === "maths") return GameType.MATHS;
  if (key === "memory") return GameType.MEMORY;
  if (key === "puzzle") return GameType.PUZZLE;
  if (key === "logic") return GameType.LOGIC;
  return GameType.MATHS;
}

export function modeParam(mode: GameMode) {
  return mode.toLowerCase().replaceAll("_", "-");
}

export function parseModeParam(
  type: GameType,
  value: string | null,
): GameMode | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase().replaceAll("-", "_");
  if (!isGameMode(normalized)) return undefined;
  if (!GAME_MODES_BY_TYPE[type].includes(normalized)) return undefined;
  return normalized;
}

export function gameSearch(type: GameType, mode?: GameMode) {
  const params = new URLSearchParams({ game: GAME_PARAM[type] });
  if (mode) params.set("mode", modeParam(mode));
  return `?${params.toString()}`;
}

export function arenaPath(type: GameType, mode?: GameMode) {
  return `/arena${gameSearch(type, mode)}`;
}

export function playPath(type: GameType, mode: GameMode, roomId?: string, results?: boolean) {
  const query = gameSearch(type, mode);
  if (!roomId) return `/play${query}`;
  if (results) return `/play/${roomId}/results${query}`;
  return `/play/${roomId}${query}`;
}

export function readGameQuery(search: string) {
  const params = new URLSearchParams(search);
  const hasGame = params.has("game");
  const type = parseGameParam(params.get("game"));
  const selectedMode = parseModeParam(type, params.get("mode"));
  const mode = selectedMode ?? resolveGameMode(type);
  return { hasGame, type, selectedMode, mode };
}
