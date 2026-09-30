import { toast } from "sonner";

export function notifyChallengeDeclined(username: string) {
    toast.error("Challenge declined", {
        description: `${username} declined your challenge.`,
    });
}

export function notifyChallengeAccepted(username: string) {
    toast.success("Challenge accepted", {
        description: `${username} accepted your challenge.`,
    });
}