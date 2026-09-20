import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  MoreHorizontal,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Arena", icon: Zap, live: true },
  { to: "#quests", label: "Quests", icon: Trophy, live: false },
  { to: "#compete", label: "Compete", icon: Swords, live: false },
  { to: "#feed", label: "Feed", icon: Bell, live: false },
  { to: "#group", label: "Group Play", icon: Users, live: false },
  { to: "#more", label: "More", icon: MoreHorizontal, live: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const playMode = location.pathname.startsWith("/play/");

  if (playMode) {
    return <div className="min-h-dvh bg-background">{children}</div>;
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/5 px-4 py-5">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-full bg-lime text-black">
            <Swords className="size-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-[0.18em] text-lime">
            MATIKS
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            if (!item.live) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/35"
                >
                  <Icon className="size-4" />
                  {item.label}
                </div>
              );
            }
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold",
                    isActive
                      ? "bg-lime/15 text-lime ring-1 ring-lime/40"
                      : "text-white/55 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mt-auto flex items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/5"
        >
          <UserAvatar name={user?.username ?? "You"} src={user?.avatar} size="sm" />
          <span className="truncate text-xs font-semibold tracking-wide text-white/70 uppercase">
            {user?.username}
          </span>
        </button>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
