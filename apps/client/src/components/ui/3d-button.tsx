import { cn } from "cn";

type ThreeDButtonProps = {
    children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ThreeDButton({
    children,
    className,
    ...props
}: ThreeDButtonProps) {
    return (
        // press feedback
        <button className={cn("w-full rounded-lg border border-b-4 border-red-300 bg-red-400 font-display text-xl font-semibold text-secondary transition-all hover:bg-red-300 hover:border-white cursor-pointer active:border-b-0 active:translate-y-0.5 active:scale-95", className)} {...props}>
            {children}
        </button>
    );
}