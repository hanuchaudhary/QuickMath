import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import { GAME_MODES_BY_TYPE, GameType, resolveGameMode } from "@quickmath/common";
import { useAuthStore } from "@/stores/auth.store";
import { GAME_TYPES } from "@/components/game-types";
import { GameTypePicker } from "@/components/game-type-picker";
import { GameModeCards } from "@/components/game-mode-cards";
import { arenaPath, playPath } from "@/lib/game-params";
import { ThreeDButton } from "@/components/ui/3d-button";
import { IconBrandGithubFilled, IconBrandX, IconBrandXFilled } from "@tabler/icons-react";

const MARQUEE = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "POWERS", "RACE", "DUEL", "FOCUS"];

export function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [selectedType, setSelectedType] = useState<GameType>(GameType.MATHS);
  const selected = GAME_TYPES.find((category) => category.id === selectedType) ?? GAME_TYPES[0];
  const modes = GAME_MODES_BY_TYPE[selectedType];
  const playTo = user ? arenaPath(selectedType) : "/auth";

  return (
    <div className="min-h-dvh bg-background text-foreground px-4">
      <header className="fixed inset-x-0 top-0 z-20 px-4">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-red-400 text-black">
              <Swords className="size-4" />
            </span>
            <span className="font-display text-3xl font-bold tracking-tighter text-red-400">
              Quick<span className="text-white">Math</span>
            </span>
          </Link>
          <ThreeDButton
            type="button"
            onClick={() => {
              if (!user) {
                navigate("/auth");
                return;
              }
              navigate(playTo);
            }}
            className="bg-red-400 border-red-300 text-secondary py-1 w-fit px-5"
          >
            {user ? "Enter arena" : "Play now"}
          </ThreeDButton>
        </div>
      </header>

      <section className="min-h-[calc(100dvh-4rem)] flex items-center max-w-6xl mx-auto">
        <div className="">
          <p className="hero-rise text-sm font-medium text-red-400 uppercase">
            Mental math arena
          </p>
          <h1
            className="hero-rise mt-3 max-w-3xl font-display text-7xl font-bold tracking-tighter leading-[0.85] text-white sm:text-8xl lg:text-9xl"
            style={{ animationDelay: "80ms" }}
          >
            RACE YOUR
            <br />
            <span className="text-red-400">BRAIN</span>
          </h1>
          <p
            className="hero-rise mt-6 max-w-md text-sm uppercase font-medium text-muted-foreground sm:text-base"
            style={{ animationDelay: "160ms" }}
          >
            Live 1v1 puzzles. Type the answer, hit first, keep the streak. No calculators. No mercy.
          </p>
          <div className="hero-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
            <ThreeDButton
              className="bg-red-400 border-red-300 text-secondary py-2 w-fit px-10"
              onClick={() => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                navigate(playPath(selectedType, resolveGameMode(selectedType, modes[0])));
              }}
            >
              Start a duel
            </ThreeDButton>
            <ThreeDButton
              type="button"
              className="bg-neutral-600 border-neutral-500 text-white py-2 w-fit px-10"
              onClick={() => {
                navigate("#arena");
              }}
            >
              See games
            </ThreeDButton>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-white/8 bg-panel py-3">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, index) => (
            <span key={`${item}-${index}`} className="font-display text-2xl text-white/35">
              {item}
              <span className="ml-10 text-red-400">●</span>
            </span>
          ))}
        </div>
      </div>

      <section id="arena" className="mx-auto max-w-2xl min-h-screen flex flex-col justify-center">
        <p className="mb-3 px-2 text-xs font-medium text-muted-foreground">GAME</p>
        <GameTypePicker types={GAME_TYPES} selectedId={selectedType} onSelect={setSelectedType} />
        <GameModeCards
          typeKey={selectedType}
          modes={modes}
          selected={selected}
          onPick={(mode) => {
            if (!user) {
              navigate("/auth");
              return;
            }
            navigate(playPath(selectedType, resolveGameMode(selectedType, mode)));
          }}
        />
      </section>

      <footer className="px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-4xl font-bold tracking-tighter text-red-400">
              Quick<span className="text-white">Math</span>
            </p>
            <p className="mt-2 max-w-sm text-sm uppercase font-medium text-muted-foreground">
              Mental math arena
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ThreeDButton onClick={() => {
              // window.open("https://x.com/kushchaudharyog", "_blank");
            }} className="bg-neutral-400 border-neutral-300 text-background p-2 w-fit rounded-md border border-b-4 cursor-pointer" >
              <IconBrandXFilled className="size-6" />
            </ThreeDButton>
            <ThreeDButton onClick={() => {
              window.open("https://github.com/hanuchaudhary", "_blank");
            }} className="bg-neutral-400 border-neutral-300 text-background p-2 w-fit rounded-md border border-b-4 cursor-pointer" >
              <IconBrandGithubFilled className="size-6" />
            </ThreeDButton>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-white/25">
          © {new Date().getFullYear()} QuickMath
        </p>
      </footer>
    </div>
  );
}
