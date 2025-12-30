import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FrameType =
  | "default"
  | "bronze"
  | "silver"
  | "gold"
  | "diamond"
  | "couple_heart"
  | "champion";

interface AvatarWithFrameProps {
  name: string;
  avatarUrl?: string | null;
  frame?: FrameType;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

const frameStyles: Record<FrameType, { border: string; shadow: string; animation?: string }> = {
  default: {
    border: "border-2 border-border",
    shadow: "",
  },
  bronze: {
    border: "border-3 border-amber-700",
    shadow: "shadow-[0_0_8px_rgba(180,83,9,0.4)]",
  },
  silver: {
    border: "border-3 border-slate-400",
    shadow: "shadow-[0_0_10px_rgba(148,163,184,0.5)]",
  },
  gold: {
    border: "border-3 border-amber-400",
    shadow: "shadow-[0_0_12px_rgba(251,191,36,0.6)]",
  },
  diamond: {
    border: "border-3 border-cyan-300",
    shadow: "shadow-[0_0_16px_rgba(103,232,249,0.7)]",
    animation: "animate-pulse",
  },
  couple_heart: {
    border: "border-3 border-pink-400",
    shadow: "shadow-[0_0_12px_rgba(244,114,182,0.5)]",
  },
  champion: {
    border: "border-4 border-amber-500",
    shadow: "shadow-[0_0_20px_rgba(245,158,11,0.7)]",
    animation: "animate-pulse",
  },
};

export function AvatarWithFrame({
  name,
  avatarUrl,
  frame = "default",
  size = "md",
  className,
  gradientFrom,
  gradientTo,
}: AvatarWithFrameProps) {
  const frameStyle = frameStyles[frame];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Default gradients based on common use cases
  const defaultGradientFrom = gradientFrom || "from-primary";
  const defaultGradientTo = gradientTo || "to-primary/80";

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          frameStyle.border,
          frameStyle.shadow,
          frameStyle.animation,
          "transition-all duration-300"
        )}
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} />
        ) : null}
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br text-white font-bold",
            defaultGradientFrom,
            defaultGradientTo,
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            size === "xl" && "text-lg"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Special decorations for certain frames */}
      {frame === "couple_heart" && (
        <span className="absolute -top-1 -right-1 text-sm">💕</span>
      )}
      {frame === "champion" && (
        <span className="absolute -top-2 -right-1 text-base">👑</span>
      )}
      {frame === "diamond" && (
        <span className="absolute -bottom-1 -right-1 text-xs">💎</span>
      )}
    </div>
  );
}
