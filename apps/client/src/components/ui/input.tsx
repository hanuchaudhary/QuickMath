import { cn } from "cn";

export function Input({
    className,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input className={cn("w-full rounded-lg border border-b-4 border-neutral-700 bg-background px-4 font-display text-lg font-bold tracking-[0.15em] text-white outline-none placeholder:text-muted-foreground focus:border-emerald-400", className)} {...props} />
    );
}