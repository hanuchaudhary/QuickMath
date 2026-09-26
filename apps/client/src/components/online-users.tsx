import { Link } from "react-router-dom";
import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { UserAvatar } from "./user-avatar";

export function OnlineUsers() {
    const user = useAuthStore((s) => s.user);
    const onlineUsers = useGameStore((s) => s.onlineUsers);
    const others = onlineUsers.filter((u) => u.id !== user?.id);
    const rail = user
        ? [{ id: user.id, username: user.username, avatar: user.avatar }, ...others]
        : others;
    return (
        <div className="flex overflow-x-auto py-4 stagger gap-2">
            {rail.slice(0, 8).map((person, index) => (
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
        </div>
    );
}