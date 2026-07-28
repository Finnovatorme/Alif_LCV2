import React from "react";
import { cn } from "@/lib/utils";

interface BooleanStatusProps {
  value: boolean | string | number | null | undefined;
  trueText?: string;
  falseText?: string;
  className?: string;
}

export function BooleanStatus({
  value,
  trueText = "Active",
  falseText = "Inactive",
  className,
}: BooleanStatusProps) {
  // Coerce value to boolean robustly
  const isTrue =
    value === true ||
    value === "true" ||
    value === "1" ||
    value === 1 ||
    value === "Y" ||
    value === "Yes" ||
    value === "yes";

  if (value == null) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border shadow-sm",
          isTrue
            ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
            : "bg-rose-500/10 text-rose-700 border-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
        )}
      >
        <span className="relative flex w-2 h-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isTrue ? "bg-emerald-400" : "bg-rose-400"
            )}
          ></span>
          <span
            className={cn(
              "relative inline-flex rounded-full w-2 h-2",
              isTrue ? "bg-emerald-500" : "bg-rose-500"
            )}
          ></span>
        </span>
        {isTrue ? trueText : falseText}
      </span>
    </div>
  );
}
