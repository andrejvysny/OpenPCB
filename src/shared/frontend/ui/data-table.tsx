import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableHeaderRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS `grid-template-columns` value, e.g. `"24px 1fr 90px"`. */
  cols: string;
}

/** Sticky column-header row for the CSS-grid tables (design D3 §5). */
export const TableHeaderRow = React.forwardRef<HTMLDivElement, TableHeaderRowProps>(
  ({ cols, className, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{ gridTemplateColumns: cols, ...style }}
      className={cn(
        "sticky top-0 z-10 grid h-[22px] items-center gap-2 border-b border-border bg-surface-panel px-[10px]",
        "text-2xs uppercase tracking-[.04em] text-text-caps",
        className,
      )}
      {...props}
    />
  ),
);
TableHeaderRow.displayName = "TableHeaderRow";

export interface TableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS `grid-template-columns` value; must match the header row. */
  cols: string;
  selected?: boolean;
  /** Row height; number is treated as px. Defaults to 22px. */
  height?: number | string;
}

/** One 22px grid row with hover + selection treatment. */
export const TableRow = React.forwardRef<HTMLDivElement, TableRowProps>(
  ({ cols, selected = false, height = 22, className, style, ...props }, ref) => (
    <div
      ref={ref}
      data-selected={selected || undefined}
      style={{
        gridTemplateColumns: cols,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      className={cn(
        "grid items-center gap-2 border-b border-border-subtle px-[10px] text-xs text-text",
        "hover:bg-surface-hover",
        selected &&
          "bg-surface-selected text-text-strong shadow-[inset_2px_0_0_var(--selection)]",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";
