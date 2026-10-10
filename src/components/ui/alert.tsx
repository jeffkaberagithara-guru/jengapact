import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const alertVariants = cva("rounded-md border p-3 text-sm", {
  variants: {
    tone: {
      info: "border-info/30 bg-info-muted text-foreground",
      success: "border-success/30 bg-success-muted text-foreground",
      warning: "border-warning/30 bg-warning-muted text-foreground",
      danger: "border-danger/30 bg-danger-muted text-foreground",
    },
  },
  defaultVariants: { tone: "info" },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, tone, role, ...props }: AlertProps) {
  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  );
}
