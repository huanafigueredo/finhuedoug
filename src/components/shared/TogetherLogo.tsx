import { cn } from "@/lib/utils";

interface TogetherLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-16 h-16",
};

export function TogetherLogo({ size = "md", className }: TogetherLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
    >
      {/* Círculo esquerdo - mais opaco */}
      <circle
        cx="15"
        cy="20"
        r="12"
        className="fill-primary"
        fillOpacity="0.85"
      />
      {/* Círculo direito - semi-transparente para criar efeito de sobreposição */}
      <circle
        cx="25"
        cy="20"
        r="12"
        className="fill-primary"
        fillOpacity="0.55"
      />
    </svg>
  );
}
