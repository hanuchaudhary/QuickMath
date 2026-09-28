import { cn } from "cn";

type ThreeDButtonProps = {
    children: React.ReactNode;
    className: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ThreeDButton({
    children,
    className,
    ...props
}: ThreeDButtonProps) {
    return (
        <button className={cn("w-full rounded-lg border border-b-4 border-red-300 bg-red-400 font-display text-xl font-semibold text-secondary transition-all hover:bg-red-300 hover:border-red-200 cursor-pointer", className)} {...props}>
            {children}
        </button>
    );
}