import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<StatusTone, string> = {
  success: "bg-status-success",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  info: "bg-status-info",
  neutral: "bg-status-neutral",
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  /** Native tooltip; also becomes the accessible name when present. */
  title?: string;
}

/** 6×6 status dot. */
export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ tone = "neutral", title, className, ...props }, ref) => (
    <span
      ref={ref}
      title={title}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        TONES[tone],
        className,
      )}
      {...props}
    />
  ),
);
StatusDot.displayName = "StatusDot";
