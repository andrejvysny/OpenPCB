import * as React from "react";
import { cn } from "@/lib/utils";

export type PillTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const TONES: Record<PillTone, string> = {
  success: "bg-status-success-soft text-status-success",
  warning: "bg-status-warning-soft text-status-warning",
  danger: "bg-status-danger-soft text-status-danger",
  info: "bg-status-info-soft text-status-info",
  neutral: "bg-status-neutral-soft text-status-neutral",
  accent: "bg-selection-soft text-text-strong",
};

const DOTS: Record<PillTone, string> = {
  success: "bg-status-success",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  info: "bg-status-info",
  neutral: "bg-status-neutral",
  accent: "bg-selection",
};

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  /** Replaces the leading status dot. */
  icon?: React.ReactNode;
  /** Set false to drop the leading dot when no icon is supplied. */
  dot?: boolean;
}

/**
 * Compact status label — the one place a pill radius is used. `StatusPill` is
 * the same component; the audit's severity language (DRC/ERC/BOM/cloud) all
 * routes through these tones so a given colour carries one meaning everywhere.
 */
export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ tone = "neutral", icon, dot = true, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center gap-1.5 rounded-pill px-2 text-2xs font-medium",
        "[&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {icon ??
        (dot ? (
          <span
            aria-hidden="true"
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOTS[tone])}
          />
        ) : null)}
      {children}
    </span>
  ),
);
Pill.displayName = "Pill";

export const StatusPill = Pill;
