import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GAME_MODES_BY_TYPE,
  GameMode,
  GameType,
  resolveGameMode,
} from "@quickmath/common";
import { GAME_PARAM, modeParam, parseGameParam, parseModeParam, playPath } from "@/lib/game-params";
import { OnlineUsers } from "@/components/online-users";
import { GAME_TYPES } from "@/components/game-types";
import { GameTypePicker } from "@/components/game-type-picker";
import { NavStats } from "@/components/nav-stats";
import { GameModeCards } from "@/components/game-mode-cards";

export function ArenaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = parseGameParam(searchParams.get("game"));
  const selectedMode = parseModeParam(selectedType, searchParams.get("mode"));
  const selected = GAME_TYPES.find((category) => category.id === selectedType) ?? GAME_TYPES[0];
  const modes = GAME_MODES_BY_TYPE[selectedType];

  function setArenaParams(type: GameType, mode?: GameMode) {
    const next: Record<string, string> = { game: GAME_PARAM[type] };
    if (mode) next.mode = modeParam(mode);
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    if (searchParams.get("game")) return;
    setArenaParams(GameType.MATHS);
  }, [searchParams]);

  function play(gameType: typeof selectedType, gameMode?: string) {
    const mode = resolveGameMode(gameType, gameMode);
    setArenaParams(gameType, mode);
    navigate(playPath(gameType, mode));
  }

  return (
    <div className="grid min-h-dvh md:grid-cols-6 md:px-8 py-6">
      <div className="col-span-4 min-w-0 md:px-16 px-4">
        <OnlineUsers />
        <p className="mt-8 mb-3 px-2 text-xs font-medium text-muted-foreground">
          GAME
        </p>
        <GameTypePicker
          types={GAME_TYPES}
          selectedId={selectedType}
          onSelect={(id) => setArenaParams(id)}
        />
        <GameModeCards
          typeKey={selectedType}
          modes={modes}
          selected={selected}
          selectedMode={selectedMode}
          onPick={(mode) => play(selectedType, mode)}
        />
      </div>

      <NavStats selected={selected} />
    </div>
  );
}
