import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const { preference, mode, isReady, setPreference } = useTheme();

  const handleChange = React.useCallback(
    (nextPreference: ThemePreference) => {
      void setPreference(nextPreference);
    },
    [setPreference],
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-control border border-border bg-surface-panel p-1",
        className,
      )}
    >
      {OPTIONS.map(({ value, label }) => {
        const isActive = preference === value;
        const showMode = value === "system" && isActive;

        return (
          <button
            key={value}
            type="button"
            disabled={!isReady}
            onClick={() => handleChange(value)}
            className={cn(
              "flex min-w-[3.5rem] flex-col items-center justify-center rounded-control border border-transparent px-3 py-1 text-xs font-medium transition-colors",
              isReady ? "cursor-pointer" : "cursor-default",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-text hover:bg-surface-hover",
            )}
          >
            <span>{label}</span>
            {showMode ? (
              <span className="mt-0.5 text-[0.625rem] leading-4 opacity-80">
                {mode === "dark" ? "Dark" : "Light"}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
