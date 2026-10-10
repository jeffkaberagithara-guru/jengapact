import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  tone?: "dark" | "light";
}

export function Logo({ className, tone = "dark" }: LogoProps) {
  const wordmark = tone === "dark" ? "text-primary" : "text-primary-foreground";
  const mark = tone === "dark" ? "fill-primary" : "fill-primary-foreground";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("h-6 w-6", mark)}
      >
        <path d="M4 21V7l8-4 8 4v14h-6v-6h-4v6H4Z" />
      </svg>
      <span className={cn("text-lg font-semibold tracking-tight", wordmark)}>
        JengaPact
      </span>
    </span>
  );
}
