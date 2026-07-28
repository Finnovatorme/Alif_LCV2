import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
          "border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900",
        variant === "secondary" &&
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200",
        variant === "outline" &&
          "border-slate-200 text-slate-900 dark:border-white/10 dark:text-white",
        variant === "destructive" &&
          "border-transparent bg-rose-600 text-white",
        className,
      )}
      {...props}
    />
  );
}
