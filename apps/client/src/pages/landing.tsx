import { Link } from "react-router-dom";
import { Brain, Clock, Swords, Timer, Zap } from "lucide-react";
import { MathPrompt } from "@/components/math-prompt";
import { useAuthStore } from "@/stores/auth.store";

const GLYPHS = [
  { symbol: "7×8", top: "12%", left: "8%", delay: "0s" },
  { symbol: "√9", top: "22%", left: "78%", delay: "0.6s" },
  { symbol: "12+5", top: "68%", left: "12%", delay: "1.1s" },
  { symbol: "3²", top: "74%", left: "82%", delay: "1.7s" },
  { symbol: "48÷6", top: "40%", left: "88%", delay: "0.3s" },
];

const PUZZLES = [
  {
    id: "sprint",
    title: "Sprint Duels",
    tag: "Math",
    live: true,
    icon: Zap,
    copy: "Solve as many as you can in 60 seconds. Highest score takes the room.",
  },
  {
    id: "fastest",
    title: "Fastest Fingers",
    tag: "Math",
    live: true,
    icon: Timer,
    copy: "One shared question. First correct answer scores. Everyone moves on together.",
  },
  {
    id: "memory",
    title: "Memory Grid",
    tag: "Memory",
    live: false,
    icon: Brain,
    copy: "Hold patterns, numbers, and sequences under pressure. Coming soon.",
  },
  {
    id: "logic",
    title: "Logic Gates",
    tag: "Logic",
    live: false,
    icon: Swords,
    copy: "Deduce the missing piece before your opponent does. Coming soon.",
  },
];

const MARQUEE = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "POWERS", "RACE", "DUEL", "FOCUS"];

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const playTo = user ? "/arena" : "/auth";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-red-400 text-black">
              <Swords className="size-4" />
            </span>
            <span className="font-display text-2xl text-red-400">QuickMath</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/60 sm:flex">
            <a href="#puzzles" className="hover:text-white">
              Puzzles
            </a>
            <Link to={playTo} className="hover:text-white">
              Arena
            </Link>
          </nav>
          <Link
            to={playTo}
            className="rounded-full bg-red-400 px-4 py-2 text-sm font-medium text-black press-feedback"
          >
            {user ? "Enter arena" : "Play now"}
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pt-28 pb-20">
        {GLYPHS.map((glyph) => (
          <span
            key={glyph.symbol}
            className="float-glyph pointer-events-none absolute font-display text-5xl text-white/8 sm:text-6xl"
            style={{ top: glyph.top, left: glyph.left, animationDelay: glyph.delay }}
          >
            {glyph.symbol}
          </span>
        ))}
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="hero-rise text-sm font-medium tracking-[0.28em] text-red-400 uppercase">
              Mental math arena
            </p>
            <h1
              className="hero-rise mt-4 max-w-xl text-7xl leading-[0.9] text-white sm:text-8xl lg:text-9xl"
              style={{ animationDelay: "80ms" }}
            >
              Race your
              <br />
              brain.
            </h1>
            <p
              className="hero-rise mt-6 max-w-md text-base leading-relaxed text-white/55 sm:text-lg"
              style={{ animationDelay: "160ms" }}
            >
              Live 1v1 puzzles. Type the answer, hit first, keep the streak. No
              calculators. No mercy.
            </p>
            <div className="hero-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Link
                to={playTo}
                className="rounded-full bg-red-400 px-6 py-3 text-sm font-medium text-black press-feedback"
              >
                Start a duel
              </Link>
              <a
                href="#puzzles"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 hover:border-white/40"
              >
                See puzzle types
              </a>
            </div>
          </div>

          <div className="hero-rise relative" style={{ animationDelay: "200ms" }}>
            <div className="rounded-[32px] border border-white/10 bg-panel p-8 shadow-[0_0_80px_rgba(182,255,59,0.12)]">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl">YOU</span>
                <span className="rounded-full bg-[#123] px-3 py-1 font-mono text-cyan">0:42</span>
                <span className="font-display text-3xl text-white/40">RIVAL</span>
              </div>
              <div className="relative mt-10 grid h-44 place-items-center">
                <div className="play-grid absolute inset-0" />
                <MathPrompt prompt="14 * 6" className="text-5xl sm:text-6xl" />
              </div>
              <div className="mt-8 grid h-14 place-items-center rounded-2xl border border-blue-400/40 bg-black/40 font-mono text-3xl text-red-400">
                84
              </div>
            </div>
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

      <section id="puzzles" className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-sm font-medium tracking-[0.28em] text-red-400 uppercase">Modes</p>
        <h2 className="mt-3 text-6xl text-white sm:text-7xl">Types of puzzles</h2>
        <p className="mt-3 max-w-lg text-white/50">
          Math is live today. Memory, puzzle, and logic boards are warming up in the queue.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {PUZZLES.map((puzzle, index) => {
            const Icon = puzzle.icon;
            return (
              <article
                key={puzzle.id}
                className="card-in group rounded-[28px] border border-white/8 bg-panel p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-400/40"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-red-400/15 text-red-400 transition group-hover:bg-red-400 group-hover:text-black">
                    <Icon className="size-5" />
                  </span>
                  <span
                    className={
                      puzzle.live
                        ? "rounded-full bg-red-400/15 px-3 py-1 text-xs font-medium text-red-400"
                        : "rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/35"
                    }
                  >
                    {puzzle.live ? "Live" : "Soon"}
                  </span>
                </div>
                <p className="mt-6 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
                  {puzzle.tag}
                </p>
                <h3 className="mt-1 text-4xl text-white">{puzzle.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{puzzle.copy}</p>
                {puzzle.live ? (
                  <Link
                    to={playTo}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-red-400"
                  >
                    Jump in
                    <Clock className="size-3.5" />
                  </Link>
                ) : (
                  <p className="mt-6 text-sm text-white/30">Not in queue yet</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/8 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-4xl text-red-400">QuickMath</p>
            <p className="mt-2 max-w-sm text-sm text-white/40">
              Fastest fingers. Cleanest math. Built for people who think in numbers.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-white/45">
            <a href="#puzzles" className="hover:text-white">
              Puzzles
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
          © {new Date().getFullYear()} QuickMath. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
