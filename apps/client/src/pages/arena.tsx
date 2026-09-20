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
    <div className="grid min-h-dvh grid-cols-[1fr_300px] gap-6 px-8 py-6">
      <div>
        <div className="flex gap-5 overflow-x-auto pb-4 stagger">
          {rail.slice(0, 8).map((person, index) => (
            <div
              key={person.id}
              className="flex min-w-[72px] flex-col items-center gap-2"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <UserAvatar name={person.username} src={person.avatar || undefined} />
              <span className="max-w-[72px] truncate text-[10px] font-semibold tracking-wide text-white/55 uppercase">
                {person.username}
              </span>
            </div>
          ))}
        </div>

        <section className="mt-2 rounded-[28px] bg-panel p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-wide">
                DAILY CHALLENGES
              </h2>
              <p className="text-sm text-white/40">Complete to earn rewards</p>
            </div>
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
              00:42
            </span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="rounded-full border border-lime/40 px-3 py-1 text-sm font-semibold text-lime">
              0/7
            </div>
            <div className="h-2 flex-1 rounded-full bg-white/8">
              <div className="h-2 w-[8%] rounded-full bg-lime" />
            </div>
            <ChevronRight className="size-5 text-white/30" />
          </div>
        </section>

        <p className="mt-8 mb-3 text-xs font-semibold tracking-[0.18em] text-white/35">
          DUELS
        </p>
        <div className="flex gap-3">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className={cn(
                "grid h-[92px] w-[108px] place-items-center rounded-[22px] border text-center",
                category.live
                  ? "border-transparent bg-yellow text-black"
                  : "border-white/8 bg-panel text-white/35",
              )}
            >
              <div>
                <Play className="mx-auto mb-1 size-5" />
                {category.live ? (
                  <p className="text-[10px] font-bold">{category.rating}</p>
                ) : null}
                <p className="text-[11px] font-bold tracking-wide uppercase">
                  {category.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => play(GameType.DUELS)}
            className="group rounded-[28px] bg-panel p-6 text-left press-feedback"
          >
            <p className="text-[11px] font-bold tracking-[0.16em] text-lime">MATH</p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-wide">
              SPRINT
              <br />
              DUELS
            </h3>
            <p className="mt-3 text-xs text-white/40">
              Race to solve the most in 1 minute
            </p>
          </button>
          <button
            type="button"
            onClick={() => play(GameType.FASTEST_FINGER_FIRST)}
            className="rounded-[28px] bg-panel p-6 text-left press-feedback"
          >
            <p className="text-[11px] font-bold tracking-[0.16em] text-lime">MATH</p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-wide">
              FASTEST FINGERS
              <br />
              DUELS
            </h3>
            <p className="mt-3 text-xs text-white/40">
              Be the first to answer each question
            </p>
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.16em] text-white/35">
            SUGGESTED FRIENDS
          </p>
          <span className="text-xs font-semibold text-lime">VIEW ALL</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {others.slice(0, 4).map((person) => (
            <div key={person.id} className="rounded-[22px] bg-panel p-4">
              <UserAvatar name={person.username} src={person.avatar || undefined} />
              <p className="mt-3 truncate text-sm font-semibold">{person.username}</p>
              <p className="truncate text-xs text-white/35">@{person.username}</p>
            </div>
          ))}
          {others.length === 0 ? (
            <p className="col-span-4 text-sm text-white/35">No one else is online yet.</p>
          ) : null}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="flex justify-end gap-2">
          <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold">
            <Gem className="mr-1 inline size-3 text-lime" /> 500
          </span>
          <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold">
            <Flame className="mr-1 inline size-3 text-orange-400" /> 0 / 7
          </span>
          <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-lime">
            0 XP
          </span>
        </div>

        <section className="rounded-[28px] bg-panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/40">
              DAILY QUEST
            </p>
            <span className="text-xs font-semibold text-lime">VIEW ALL</span>
          </div>
          <QuestRow title="Complete Starter Quest" progress="1/1" done />
          <QuestRow title="Play any 2 Duels" progress="0/2" />
          <QuestRow title="Win 1 Sprint Duel" progress="0/1" />
        </section>

        <section className="rounded-[28px] bg-panel p-5">
          <h3 className="font-display text-xl font-semibold tracking-wide">
            DOWNLOAD MOBILE APP
          </h3>
          <p className="mt-1 text-xs text-white/40">Scan the QR code using your phone</p>
          <div className="mt-4 grid h-28 place-items-center rounded-2xl bg-white/5 text-xs text-white/30">
            Coming soon
          </div>
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
          <span className="grid size-6 place-items-center rounded-full bg-lime text-[10px] font-bold text-black">
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
            className={cn("h-1.5 rounded-full", done ? "w-full bg-yellow" : "w-1/5 bg-lime")}
          />
        </div>
        <span className="text-[10px] text-white/35">{progress}</span>
      </div>
    </div>
  );
}
