import * as React from "react";
import { cn } from "@/lib/utils";

export type PropertyGridProps = React.HTMLAttributes<HTMLDivElement>;

/** Two-column label/value grid used by every inspector (design D2 §7). */
export const PropertyGrid = React.forwardRef<HTMLDivElement, PropertyGridProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid grid-cols-[96px_1fr]", className)}
      {...props}
    />
  ),
);
PropertyGrid.displayName = "PropertyGrid";

export interface PropertyRowProps {
  label: React.ReactNode;
  /** Renders the value cell in the mono face (ids, coordinates, counts). */
  mono?: boolean;
  /** Trailing muted suffix inside the value cell (units, secondary ids). */
  hint?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  title?: string;
}

/** One 22px label/value pair. Must be rendered inside a `PropertyGrid`. */
export function PropertyRow({
  label,
  mono = false,
  hint,
  children,
  className,
  labelClassName,
  valueClassName,
  title,
}: PropertyRowProps) {
  return (
    <>
      <div
        title={title}
        className={cn(
          "flex h-[22px] min-w-0 items-center border-b border-border px-2 text-xs text-text-tertiary",
          className,
          labelClassName,
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div
        className={cn(
          "flex h-[22px] min-w-0 items-center gap-1.5 border-b border-border-subtle px-2 text-xs text-text-strong",
          mono && "font-mono",
          className,
          valueClassName,
        )}
      >
        <div className="min-w-0 flex-1 truncate">{children}</div>
        {hint !== undefined && hint !== null ? (
          <span className="shrink-0 text-text-disabled">{hint}</span>
        ) : null}
      </div>
    </>
  );
}
