import { AnimatePresence, motion } from "motion/react";
import { IconX } from "@tabler/icons-react";

import { ThreeDButton } from "./ui/3d-button";
import { UserAvatar } from "./user-avatar";

import { useGameStore } from "@/stores/game.store";
import { useEffect } from "react";
import { toast } from "sonner";

export function ChallengePopover() {
    const { challenges, removeChallenge, acceptChallenge, declineChallenge, error, clearError } =
        useGameStore();
        
    useEffect(() => {
        const timeout = setTimeout(() => {
            clearError();
        }, 1500);
        if (error) {
            toast.error(error, {
                duration: 1500,
            })
        }
        return () => clearTimeout(timeout);
    }, [error, clearError]);

    return (
        <div className="fixed top-0 right-0 z-100 w-full max-w-md pointer-events-none">
            <AnimatePresence mode="popLayout">
                {challenges.slice(0, 3).map((challenge, idx) => (
                    <motion.div
                        key={challenge.id}
                        layout
                        initial={{
                            y: -80,
                            scale: 0.90,
                        }}
                        animate={{
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            y: -250,
                            scale: 0.90,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                        }}
                        className="absolute top-4 right-4 w-[calc(100%-2rem)] max-w-md pointer-events-auto"
                        style={{
                            top: `${16 + idx * 10}px`,
                            scaleX: 1 - idx * 0.1,
                            zIndex: challenges.length - idx,
                        }}
                    >
                        <div className="relative rounded-3xl border border-b-4 border-white/10 bg-secondary px-6 py-4">
                            <ThreeDButton
                                onClick={() => removeChallenge(challenge.id)}
                                className="absolute -top-2 -right-2 flex size-10 items-center justify-center rounded-full"
                            >
                                <IconX className="size-6 text-white" />
                            </ThreeDButton>

                            <h1 className="text-2xl font-bold text-red-400">
                                CHALLENGE
                            </h1>

                            <div className="my-4 flex items-center gap-2 font-display">
                                <UserAvatar
                                    name={challenge.challenger.username}
                                    src={challenge.challenger.avatar || undefined}
                                    size="md"
                                />

                                <p className="max-w-sm text-xl leading-none">
                                    {challenge.challenger.username} challenged
                                    you to a {challenge.gameType}{" "}
                                    {challenge.gameMode} game.
                                </p>
                            </div>

                            <div className="mt-8 flex gap-2">
                                <ThreeDButton
                                    variant="secondary"
                                    onClick={() => {
                                        declineChallenge(challenge.id);
                                        removeChallenge(challenge.id);
                                    }}
                                    className="py-1"
                                >
                                    Decline
                                </ThreeDButton>
                                <ThreeDButton
                                    onClick={() => {
                                        acceptChallenge(challenge.id);
                                        removeChallenge(challenge.id);
                                    }}
                                    className="py-1"
                                >
                                    Accept
                                </ThreeDButton>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}