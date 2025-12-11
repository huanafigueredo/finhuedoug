import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft hover:shadow-glow hover:-translate-y-2 transition-all duration-300",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-romantic flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
