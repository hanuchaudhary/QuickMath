import { IconDiamondFilled, IconFlameFilled } from "@tabler/icons-react";
import { cn } from "cn";

export function NavStats({ selected }: {
    selected: {
        text: string;
    }
}
) {
    return (
        <aside className="col-span-2 hidden flex-col gap-4 md:flex">
            <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <span className="rounded-full bg-secondary px-3 py-2 text-sm font-semibold border flex items-center justify-center">
                    <IconDiamondFilled className={cn("mr-1 inline size-5", selected.text)} /> 500
                </span>
                <span className="rounded-full bg-secondary px-3 py-2 text-sm font-semibold border flex items-center justify-center">
                    <IconFlameFilled className="mr-1 inline size-5 text-orange-400" /> 0 / 7
                </span>
                <span className={cn("rounded-full bg-secondary px-3 py-2 text-sm font-semibold border flex items-center justify-center", selected.text)}>
                    0 XP
                </span>
            </div>
        </aside>
    );
}