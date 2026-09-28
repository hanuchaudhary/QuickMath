import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "cn";

export function BackButton({
    to,
    className,
}: {
    to: string;
    className?: string;
}) {
    const navigate = useNavigate();
    return (
        <button
            type="button"
            onClick={() => navigate(to)}
            className={cn("flex size-10 items-center justify-center rounded-lg bg-secondary text-white transition-all hover:bg-white/10 border border-b-4 border-neutral-700 cursor-pointer active:border-b-0 active:translate-y-0.5 active:scale-95", className)}
        >
            <ChevronLeft className="size-5" />
        </button>
    );
}