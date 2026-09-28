import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { GameType, useGameStore } from "@/stores/game.store";

import {
    GAME_MODES_BY_TYPE,
    GameMode,
    type CreateCustomRoomSchema,
    type GameDifficulty,
} from "@quickmath/common";

type OptionSelectProps = {
    value: string;
    options: string[];
    onChange: (value: string) => void;
};

function OptionSelect({
    value,
    options,
    onChange,
}: OptionSelectProps) {
    return (
        <Select
            value={value}
            onValueChange={(value) => onChange(value ?? "")}
        >
            <SelectTrigger className="h-15.5 w-62.5 rounded-2xl border-2 border-b-4 border-neutral-600 bg-transparent px-4 text-lg font-medium text-white focus:ring-0 focus-visible:border-red-400 [&_svg]:size-5 [&_svg]:text-white [&_svg]:opacity-100">
                <SelectValue />
            </SelectTrigger>

            <SelectContent className="rounded-xl border-2 border-neutral-600 bg-neutral-900 text-white">
                {options.map((option) => (
                    <SelectItem
                        key={option}
                        value={option}
                        className="py-3 text-base focus:bg-neutral-800 focus:text-white"
                    >
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

type StepperProps = {
    value: number;
    step?: number;
    min?: number;
    max?: number;
    label?: string;
    onChange: (value: number) => void;
};

function Stepper({
    value,
    step = 1,
    min = 0,
    max = Infinity,
    label,
    onChange,
}: StepperProps) {
    const clamp = (n: number) =>
        Math.min(max, Math.max(min, n));

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-50 items-center overflow-hidden rounded-xl border-2 border-neutral-700 bg-neutral-900">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onChange(clamp(value - step))}
                    className="h-full w-14 rounded-none text-xl font-semibold text-white hover:bg-neutral-800 hover:text-white"
                >
                    -
                </Button>

                <span className="flex-1 text-center text-lg font-semibold text-white">
                    {value}
                </span>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onChange(clamp(value + step))}
                    className="h-full w-14 rounded-none text-xl font-semibold text-red-400 hover:bg-neutral-800 hover:text-red-400"
                >
                    +
                </Button>
            </div>

            {label && (
                <span className="text-sm font-semibold text-red-400">
                    {label}
                </span>
            )}
        </div>
    );
}

type RowProps = {
    title: string;
    children: React.ReactNode;
};

function Row({ title, children }: RowProps) {
    return (
        <div className="flex items-start justify-between py-2">
            <span className="pt-3 text-xl font-semibold text-white">
                {title}
            </span>

            <div className="flex items-start gap-3">
                {children}
            </div>
        </div>
    );
}

export default function CreateRoomPage() {
    const [config, setConfig] = useState<CreateCustomRoomSchema>({
        gameType: GameType.MATHS,
        gameMode: GameMode.DUEL,
        gameConfig: {
            difficulty: "medium",
            timeLimit: 2,
            maxPlayers: 2,
        },
    });

    const [joinCode, setJoinCode] = useState("");
    const [joinedPlayers, setJoinedPlayers] = useState<string[]>([]);

    const { socket } = useGameStore();

    const availableModes =
        GAME_MODES_BY_TYPE[config.gameType];

    useEffect(() => {
        const modes = GAME_MODES_BY_TYPE[config.gameType];

        if (!modes.includes(config.gameMode)) {
            setConfig((prev) => ({
                ...prev,
                gameMode: modes[0],
            }));
        }
    }, [config.gameType, config.gameMode]);

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
                        difficulty: config.gameConfig.difficulty,
                        timeLimit: config.gameConfig.timeLimit * 60,
                        maxPlayers: config.gameConfig.maxPlayers,
                    },
                },
            }),
        );
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background font-sans text-foreground">
            <main className="flex flex-1 justify-center px-6 py-6">
                <div className="flex w-full max-w-3xl flex-col">
                    <header className="mb-4 flex items-center gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-xl border-2 border-b-4 border-neutral-600 bg-transparent text-white hover:border-neutral-400 hover:bg-transparent hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>

                        <h1 className="text-3xl font-bold">
                            Create a Room
                        </h1>
                    </header>

                    <section className="flex-1">
                        <Row title="Game Type">
                            <OptionSelect
                                value={config.gameType}
                                options={Object.values(GameType)}
                                onChange={handleGameTypeChange}
                            />
                        </Row>

                        <Row title="Game Mode">
                            <OptionSelect
                                value={config.gameMode}
                                options={availableModes}
                                onChange={(value) =>
                                    setConfig((prev) => ({
                                        ...prev,
                                        gameMode: value as GameMode,
                                    }))
                                }
                            />
                        </Row>

                        <Row title="Time Duration (in minutes)">
                            <Stepper
                                value={config.gameConfig.timeLimit}
                                min={1}
                                max={60}
                                onChange={(value) =>
                                    setConfig((prev) => ({
                                        ...prev,
                                        gameConfig: {
                                            ...prev.gameConfig,
                                            timeLimit: value,
                                        },
                                    }))
                                }
                            />
                        </Row>

                        <Row title="Difficulty">
                            <OptionSelect
                                value={config.gameConfig.difficulty}
                                options={["easy", "medium", "hard"]}
                                onChange={(value) =>
                                    setConfig((prev) => ({
                                        ...prev,
                                        gameConfig: {
                                            ...prev.gameConfig,
                                            difficulty:
                                                value as GameDifficulty,
                                        },
                                    }))
                                }
                            />
                        </Row>

                        <Row title="Max Players">
                            <Stepper
                                value={config.gameConfig.maxPlayers}
                                min={2}
                                max={8}
                                onChange={(value) =>
                                    setConfig((prev) => ({
                                        ...prev,
                                        gameConfig: {
                                            ...prev.gameConfig,
                                            maxPlayers: value,
                                        },
                                    }))
                                }
                            />
                        </Row>
                    </section>

                    <footer className="mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCreate}
                            className="h-16 w-full rounded-2xl border-2 border-b-4 border-red-400 bg-red-400 text-lg font-bold uppercase tracking-wide text-white hover:bg-red-400 hover:text-white"
                        >
                            Create Room
                        </Button>
                    </footer>
                </div>

                <div>
                    <p>Join Code: {joinCode}</p>
                </div>
            </main>

            <div>
                Players: {joinedPlayers.length}
            </div>
        </div>
    );
}