import { BackButton } from "@/components/ui/back";
import { ThreeDButton } from "@/components/ui/3d-button";

import { GameType, useGameStore } from "@/stores/game.store";

import {
    GAME_MODES_BY_TYPE,
    GameMode,
    type CreateCustomRoomSchema,
} from "@quickmath/common";
import RoomForm from "./room-form";
import { useState } from "react";

export default function CreateRoomPage() {
    const { socket } = useGameStore();
    const [config, setConfig] = useState<CreateCustomRoomSchema>({
        gameType: GameType.MATHS,
        gameMode: GameMode.DUEL,
        gameConfig: {
            difficulty: "medium",
            timeLimit: 2,
            maxPlayers: 2,
        },
    });

    const handleGameTypeChange = (value: string) => {
        const gameType = value as GameType;
        const modes = GAME_MODES_BY_TYPE[gameType];

        setConfig((prev) => ({
            ...prev,
            gameType,
            gameMode: modes[0],
        }));
    };

    const handleCreate = () => {
        socket?.send(
            JSON.stringify({
                type: "CREATE_CUSTOM_ROOM",
                payload: {
                    gameType: config.gameType,
                    gameMode: config.gameMode,
                    gameConfig: {
                        difficulty:
                            config.gameConfig.difficulty,
                        timeLimit:
                            config.gameConfig.timeLimit * 60,
                        maxPlayers:
                            config.gameConfig.maxPlayers,
                    },
                },
            }),
        );
    };

    return (
        <div className="min-h-dvh bg-background px-6 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <header>
                    <BackButton to="/compete" />

                    <div className="mt-8">
                        <h1 className="mt-1 font-display text-5xl font-bold">
                            Create Your Game
                        </h1>

                        <p className="subheading text-xs! font-semibold">
                            Choose how you want to compete.
                        </p>
                    </div>
                </header>

                <RoomForm handleGameTypeChange={handleGameTypeChange} config={config} setConfig={setConfig} />
                <ThreeDButton
                    onClick={handleCreate}
                    className="mt-6 h-16"
                >
                    CREATE ROOM
                </ThreeDButton>
            </div>
        </div>
    );
}