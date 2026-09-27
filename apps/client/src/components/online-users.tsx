import { Link } from "react-router-dom";
import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { UserAvatar } from "./user-avatar";

export function OnlineUsers() {
    const { user } = useAuthStore();
    const { onlineUsers } = useGameStore();
    const others = onlineUsers.filter((u) => u.id !== user?.id);
    const rail = user
        ? [{ id: user.id, username: user.username, avatar: user.avatar }, ...others]
        : others;
    return (
        <div className="flex overflow-x-auto py-4 stagger md:gap-2 scrollbar-hide mask-x-from-95%">
            {rail.slice(0, 20).map((person, index) => (
                <Link
                    to={`/profile/${person.username}`}
                    key={person.id}
                    className="flex min-w-18 flex-col items-center gap-2"
                    style={{ animationDelay: `${index * 40}ms` }}
                >
                    <UserAvatar isOnline={true} size="lg" name={person.username} src={person.avatar || undefined} />
                    <span className="max-w-18 truncate text-xs font-semibold">
                        {person.id === user?.id ? "YOU" : person.username}
                    </span>
                </Link>
            ))}
            {
                rail.length > 20 && (
                    <Link
                        to="/online"
                        className="flex size-18 bg-red-400 rounded-full items-center justify-center text-background font-display text-4xl font-bold"
                    >
                        +{20 - rail.length}
                    </Link>
                )
            }
        </div>
    );
}