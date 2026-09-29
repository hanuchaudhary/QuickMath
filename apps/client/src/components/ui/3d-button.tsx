import { cn } from "cn";

type ThreeDButtonProps = {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "tertiary";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ThreeDButton({
    children,
    className,
    variant = "primary",
    ...props
}: ThreeDButtonProps) {
    return (
        // press feedback
        <button className={cn("w-full rounded-lg border border-b-4 font-display text-xl font-semibold text-secondary transition-all cursor-pointer active:border-b-0 active:translate-y-0.5 active:scale-95",
            variant === "primary" && "bg-red-400 border-red-300 hover:bg-red-300 hover:border-white",
            variant === "secondary" && "bg-neutral-200 border-neutral-400 hover:bg-white hover:border-neutral-400",
            variant === "tertiary" && "bg-gray-400 border-gray-300 hover:bg-gray-200 hover:border-gray-300",
            className,
        )} {...props}>
            {children}
        </button>
    );
}