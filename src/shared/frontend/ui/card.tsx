import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover border affordance (for clickable cards). */
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-control border border-border bg-surface-panel",
        interactive &&
          "group relative transition-colors duration-75 hover:border-text-tertiary",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
