import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GameType } from "@/stores/game.store";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { GAME_MODES_BY_TYPE, GameMode, type CreateCustomRoomSchema, type GameDifficulty } from "@quickmath/common";


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
            onValueChange={(value) =>
                onChange(value ?? "")
            }
        >
            <SelectTrigger className="w-full rounded-lg border py-5 border-b-4 border-neutral-700 bg-background px-4 font-display text-base font-bold text-white focus:border-red-400 focus:ring-0 [&_svg]:size-5 [&_svg]:text-white">
                <SelectValue />
            </SelectTrigger>

            <SelectContent className="rounded-lg border p-2 border-neutral-700 bg-secondary text-white">
                {options.map((option) => (
                    <SelectItem
                        key={option}
                        value={option}
                        className="py-3 font-display text-base font-bold focus:bg-white/10 focus:text-white"
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
    onChange: (value: number) => void;
};

function Stepper({
    value,
    step = 1,
    min = 0,
    max = Infinity,
    onChange,
}: StepperProps) {
    const clamp = (n: number) =>
        Math.min(max, Math.max(min, n));

    return (
        <div className="flex h-10 w-full overflow-hidden rounded-lg border py-5 border-b-4 border-neutral-700 bg-background">
            <Button
                type="button"
                variant="ghost"
                onClick={() =>
                    onChange(clamp(value - step))
                }
                className="h-full w-10 rounded-none text-xl font-bold text-white hover:bg-secondary cursor-pointer hover:text-white"
            >
                -
            </Button>

            <span className="flex flex-1 items-center justify-center font-display text-xl font-bold">
                {value}
            </span>

            <Button
                type="button"
                variant="ghost"
                onClick={() =>
                    onChange(clamp(value + step))
                }
                className="h-full w-14 rounded-none text-xl font-bold text-red-400 hover:bg-white/10 hover:text-red-300"
            >
                +
            </Button>
        </div>
    );
}

type ConfigFieldProps = {
    label: string;
    children: React.ReactNode;
};

function ConfigField({
    label,
    children,
}: ConfigFieldProps) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground pl-1">
                {label}
            </p>

            {children}
        </div>
    );
}

export default function RoomForm({ handleGameTypeChange, config, setConfig }: {
    handleGameTypeChange: (value: string) => void;
    config: CreateCustomRoomSchema;
    setConfig: Dispatch<SetStateAction<CreateCustomRoomSchema>>;
}) {

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
    return (
        <section className="">
            <div className="space-y-4 mb-4">
                <ConfigField label="GAME TYPE">
                    <OptionSelect
                        value={config.gameType}
                        options={Object.values(GameType)}
                        onChange={
                            handleGameTypeChange
                        }
                    />
                </ConfigField>

                <ConfigField label="GAME MODE">
                    <OptionSelect
                        value={config.gameMode}
                        options={availableModes}
                        onChange={(value) =>
                            setConfig((prev) => ({
                                ...prev,
                                gameMode:
                                    value as GameMode,
                            }))
                        }
                    />
                </ConfigField>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <ConfigField label="TIME DURATION (MINUTES)">
                    <div>
                        <Stepper
                            value={
                                config.gameConfig
                                    .timeLimit
                            }
                            min={1}
                            max={60}
                            onChange={(value) =>
                                setConfig((prev) => ({
                                    ...prev,
                                    gameConfig: {
                                        ...prev.gameConfig,
                                        timeLimit:
                                            value,
                                    },
                                }))
                            }
                        />
                    </div>
                </ConfigField>

                <ConfigField label="DIFFICULTY">
                    <OptionSelect
                        value={
                            config.gameConfig
                                .difficulty
                        }
                        options={[
                            "easy",
                            "medium",
                            "hard",
                        ]}
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
                </ConfigField>
                <ConfigField label="MAX PLAYERS">
                    <div className="max-w-sm">
                        <Stepper
                            value={
                                config.gameConfig
                                    .maxPlayers
                            }
                            min={2}
                            max={8}
                            onChange={(value) =>
                                setConfig((prev) => ({
                                    ...prev,
                                    gameConfig: {
                                        ...prev.gameConfig,
                                        maxPlayers:
                                            value,
                                    },
                                }))
                            }
                        />
                    </div>
                </ConfigField>
            </div>
        </section>
    );
}