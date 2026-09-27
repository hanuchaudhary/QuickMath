import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import { GAME_MODES_BY_TYPE, GameType, resolveGameMode } from "@quickmath/common";
import { useAuthStore } from "@/stores/auth.store";
import { GAME_TYPES } from "@/components/game-types";
import { GameTypePicker } from "@/components/game-type-picker";
import { GameModeCards } from "@/components/game-mode-cards";
import { arenaPath, playPath } from "@/lib/game-params";

const MARQUEE = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "POWERS", "RACE", "DUEL", "FOCUS"];

export function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [selectedType, setSelectedType] = useState<GameType>(GameType.MATHS);
  const selected = GAME_TYPES.find((category) => category.id === selectedType) ?? GAME_TYPES[0];
  const modes = GAME_MODES_BY_TYPE[selectedType];
  const playTo = user ? arenaPath(selectedType) : "/auth";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-red-400 text-black">
              <Swords className="size-4" />
            </span>
            <span className="font-display text-3xl font-bold tracking-tighter text-red-400">
              Quick<span className="text-white">Math</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium uppercase text-white/60 sm:flex">
            <a href="#arena" className="hover:text-white">
              Games
            </a>
            <Link to={playTo} className="hover:text-white">
              Arena
            </Link>
          </nav>
          <Link
            to={playTo}
            className="rounded-2xl bg-red-400 px-4 py-2 text-sm font-medium text-black press-feedback"
          >
            {user ? "Enter arena" : "Play now"}
          </Link>
        </div>
      </header>

      <section className="px-6 pt-28 pb-16">
        <div className="mx-auto max-w-6xl">
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
            <Link
              to={playTo}
              className="rounded-2xl bg-red-400 px-6 py-3 text-sm font-medium text-black press-feedback"
            >
              Start a duel
            </Link>
            <a
              href="#arena"
              className="rounded-2xl bg-secondary px-6 py-3 text-sm font-medium text-white/80"
            >
              See games
            </a>
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

      <section id="arena" className="mx-auto max-w-6xl px-6 py-16">
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

      <footer className="border-t border-white/8 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-4xl font-bold tracking-tighter text-red-400">
              Quick<span className="text-white">Math</span>
            </p>
            <p className="mt-2 max-w-sm text-sm uppercase font-medium text-muted-foreground">
              Fastest fingers. Cleanest math.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-medium uppercase text-white/45">
            <a href="#arena" className="hover:text-white">
              Games
            </a>
            <Link to={playTo} className="hover:text-white">
              Arena
            </Link>
            <Link to="/auth" className="hover:text-white">
              Sign in
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-white/25">
          © {new Date().getFullYear()} QuickMath
        </p>
      </footer>
    </div>
  );
}
