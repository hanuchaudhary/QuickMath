import { ChevronRight, Flame, Gem, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GameType } from "@matix/common";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useGameStore } from "@/stores/game.store";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "math", label: "Math", live: true, rating: 992 },
  { id: "memory", label: "Memory", live: false },
  { id: "puzzle", label: "Puzzle", live: false },
  { id: "logic", label: "Logic", live: false },
];

export function ArenaPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const onlineUsers = useGameStore((s) => s.onlineUsers);
  const others = onlineUsers.filter((u) => u.id !== user?.id);
  const rail = user
    ? [{ id: user.id, username: "YOU", avatar: user.avatar }, ...others]
    : others;

  function play(gameType: typeof GameType.DUELS | typeof GameType.FASTEST_FINGER_FIRST) {
    navigate(`/play/${gameType}`);
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 gap-6 px-4 py-4 md:px-6 md:py-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 max-w-2xl mx-auto">
        <div className="flex overflow-x-auto pb-4 stagger">
          {rail.slice(0, 8).map((person, index) => (
            <div
              key={person.id}
              className="flex min-w-18 flex-col items-center gap-2"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <UserAvatar name={person.username} src={person.avatar || undefined} />
              <span className="max-w-18 truncate text-[10px] font-semibold tracking-wide text-white/55 uppercase">
                {person.username}
              </span>
            </div>
          ))}
        </div>

        <section className="mt-2 rounded-[28px] bg-panel p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-wide sm:text-4xl">
                DAILY CHALLENGES
              </h2>
              <p className="text-sm text-white/40">Complete to earn rewards</p>
            </div>
            <span className="shrink-0 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
              00:42
            </span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="rounded-full border border-blue-400/40 px-3 py-1 text-sm font-semibold text-blue-400">
              0/7
            </div>
            <div className="h-2 flex-1 rounded-full bg-white/8">
              <div className="h-2 w-[8%] rounded-full bg-blue-400" />
            </div>
            <ChevronRight className="size-5 shrink-0 text-white/30" />
          </div>
        </section>

        <p className="mt-8 mb-3 px-2 text-xs font-medium text-muted-foreground">
          DUELS
        </p>
        <div className="gap-3 p-1 grid grid-cols-4">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className={cn(
                "grid shrink-0 h-22 w-full place-items-center rounded-[22px] border text-center",
                category.live
                  ? "border-4 border-background bg-yellow text-black ring-1 ring-yellow"
                  : "border-white/8 bg-panel text-white/35",
              )}
            >
              <div>
                <Play className="mx-auto mb-1 size-5 fill-current" />
                <p className="text-sm font-bold tracking-wide uppercase">
                  {category.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => play(GameType.DUELS)}
            className="group cursor-pointer rounded-3xl bg-panel p-5 text-left press-feedback transition-all duration-300 hover:ring-4 hover:ring-blue-400 sm:p-6"
          >
            <p className="text-sm font-medium text-blue-400">MATH</p>
            <h3 className="mt-6 font-display text-4xl font-bold tracking-tighter sm:mt-10 sm:text-5xl lg:text-5xl">
              SPRINT
              <br />
              DUELS
            </h3>
            <p className="mt-4 text-sm text-muted-foreground sm:mt-6">
              Race to solve the most in 1 minute
            </p>
          </button>
          <button
            type="button"
            onClick={() => play(GameType.FASTEST_FINGER_FIRST)}
            className="cursor-pointer rounded-3xl bg-panel p-5 text-left press-feedback transition-all duration-300 hover:ring-4 hover:ring-blue-400 sm:p-6"
          >
            <p className="text-sm font-medium text-blue-400">MATH</p>
            <h3 className="mt-6 font-display text-4xl font-bold tracking-tighter sm:mt-10 sm:text-5xl lg:text-5xl">
              FASTEST FINGERS
              <br />
              DUELS
            </h3>
            <p className="mt-4 text-sm text-muted-foreground sm:mt-6">
              Be the first to answer each question
            </p>
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            SUGGESTED FRIENDS
          </p>
          <span className="text-sm font-medium text-blue-400">VIEW ALL</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {others.slice(0, 4).map((person) => (
            <div key={person.id} className="rounded-[22px] bg-panel p-4">
              <UserAvatar name={person.username} src={person.avatar || undefined} />
              <p className="mt-3 truncate text-sm font-semibold">{person.username}</p>
              <p className="truncate text-xs text-white/35">@{person.username}</p>
            </div>
          ))}
          {others.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">No one else is online yet.</p>
          ) : null}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
          <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold">
            <Gem className="mr-1 inline size-3 text-blue-400" /> 500
          </span>
          <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold">
            <Flame className="mr-1 inline size-3 text-orange-400" /> 0 / 7
          </span>
          <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-blue-400">
            0 XP
          </span>
        </div>

        <section className="rounded-[28px] bg-panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/40">
              DAILY QUEST
            </p>
            <span className="text-xs font-semibold text-blue-400">VIEW ALL</span>
          </div>
          <QuestRow title="Complete Starter Quest" progress="1/1" done />
          <QuestRow title="Play any 2 Duels" progress="0/2" />
          <QuestRow title="Win 1 Sprint Duel" progress="0/1" />
        </section>
      </aside>
    </div>
  );
}

function QuestRow({
  title,
  progress,
  done,
}: {
  title: string;
  progress: string;
  done?: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{title}</p>
        {done ? (
          <span className="grid size-6 place-items-center rounded-full bg-blue-400 text-[10px] font-bold text-black">
            ✓
          </span>
        ) : (
          <button
            type="button"
            className="rounded-full bg-yellow px-3 py-1 text-[11px] font-bold text-black"
          >
            Play Now
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-white/8">
          <div
            className={cn("h-1.5 rounded-full", done ? "w-full bg-yellow" : "w-1/5 bg-blue-400")}
          />
        </div>
        <span className="text-[10px] text-white/35">{progress}</span>
      </div>
    </div>
  );
}
