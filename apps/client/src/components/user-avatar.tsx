import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-[#ff5a7a]",
  "bg-[#ff8a3c]",
  "bg-[#ffd54a]",
  "bg-[#b6ff3b]",
  "bg-[#3dffc5]",
  "bg-[#5b8cff]",
  "bg-[#c45cff]",
  "bg-[#ff4fd8]",
];

export function avatarTone(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function UserAvatar({
  isOnline = false,
  name,
  src,
  size = "md",
  className,
}: {
  isOnline?: boolean;
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? "size-8 text-[11px]" : size === "lg" ? "size-18 text-lg" : "size-11 text-sm";

  if (src) {
    return (
      <div className="relative">
        <img
          src={src}
          alt={name}
          className={cn("rounded-full object-cover ring-2 ring-black/40", dim, className)}
        />
        {isOnline && <div className="absolute top-1 right-1 size-4 rounded-full bg-green-300 ring-2 ring-background" />}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid place-items-center rounded-full font-semibold text-black ring-2 ring-black/40",
        dim,
        avatarTone(name),
        className,
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
