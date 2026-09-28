import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  MoreHorizontal,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { IconLayoutSidebarLeftCollapseFilled, IconLayoutSidebarRightCollapseFilled, IconLockFilled } from "@tabler/icons-react";
import { UserAvatar } from "./user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/arena", label: "Arena", icon: Zap, live: true },
  { to: "/compete", label: "Compete", icon: Swords, live: true },
  { to: "#quests", label: "Quests", icon: Trophy, live: false },
  { to: "#feed", label: "Feed", icon: Bell, live: false },
  { to: "#group", label: "Group Play", icon: Users, live: false },
  { to: "#more", label: "More", icon: MoreHorizontal, live: false },
];

const SIDEBAR_KEY = "quickmath-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const playMode = location.pathname === "/play" || location.pathname.startsWith("/play/");
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  if (playMode) {
    return <div className="min-h-dvh bg-background">{children}</div>;
  }

  const compact = collapsed && !mobileOpen;

  return (
    <div className="flex min-h-dvh bg-background uppercase">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/55 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-white/5 bg-background py-5 transition-[width,transform] duration-200 ease-out",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-65",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          compact ? "lg:w-19 lg:px-2" : "lg:w-65 lg:px-4",
          "px-4",
        )}
      >
        <div
          className={cn(
            "mb-8 flex items-center",
            compact ? "justify-center" : "gap-2 px-2",
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-400 text-black">
            <Swords className="size-6" />
          </span>
          {!compact ? (
            <Link to={"/arena?game=math"} className="font-display text-4xl font-bold tracking-tighter text-red-400">
              Quick<span className="text-white">
                Math
              </span>
            </Link>
          ) : null}
          <button
            type="button"
            className="ml-auto grid size-8 place-items-center rounded-full text-white/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const itemClass = cn(
              "flex items-center rounded-xl py-2.5 text-sm font-medium",
              compact ? "justify-center px-0" : "gap-3 px-3",
            );
            if (!item.live) {
              return (
                <div
                  key={item.label}
                  title={item.label}
                  className={cn(itemClass, "text-white/35")}
                >
                  {/* <Icon className="size-4 shrink-0" /> */}
                  <IconLockFilled className="size-5 shrink-0 " />
                  {!compact ? item.label : null}
                </div>
              );
            }
            return (
              <NavLink
                key={item.label}
                to={item.to}
                title={item.label}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    itemClass,
                    "font-medium",
                    isActive
                      ? "border-4 border-background bg-secondary/30 text-red-400 ring-2 ring-red-400"
                      : "text-white/55 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <Icon className="size-5 shrink-0 fill-current" />
                {!compact ? item.label : null}
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mb-2 hidden items-center rounded-2xl py-2.5 text-sm text-white/45 hover:bg-white/5 hover:text-white lg:flex",
            compact ? "justify-center" : "gap-3 px-3",
          )}
        >
          {compact ? (
            <IconLayoutSidebarRightCollapseFilled className="size-5 shrink-0" />
          ) : (
            <>
              <IconLayoutSidebarLeftCollapseFilled className="size-5 shrink-0" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            navigate(user?.username ? `/profile/${user.username}` : "/profile");
          }}
          title={user?.username}
          className={cn(
            "flex items-center rounded-2xl py-2 text-left hover:bg-white/5",
            compact ? "justify-center px-0" : "gap-3 px-2",
          )}
        >
          <UserAvatar name={user?.username ?? "You"} src={user?.avatar} size="sm" />
          {!compact ? (
            <span className="truncate text-xs font-medium tracking-wide text-white/70 uppercase">
              {user?.username}
            </span>
          ) : null}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="grid size-10 place-items-center rounded-2xl bg-panel"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display text-2xl md:text-3xl tracking-tighter text-red-400">
            Quick<span className="text-white">Math</span>
          </span>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
