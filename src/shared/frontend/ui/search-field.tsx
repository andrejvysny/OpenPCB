import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** Keyboard hint rendered right-aligned in mono (e.g. `"/"`, `"⌘K"`). */
  shortcutHint?: React.ReactNode;
  /** Class applied to the field wrapper (the visible box). */
  containerClassName?: string;
}

/** 22px search input with leading glyph (design D3 §5). */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ shortcutHint, containerClassName, className, ...props }, ref) => (
    <label
      className={cn(
        "flex h-[22px] min-w-0 items-center gap-1.5 rounded-control border border-border-control bg-surface-input px-1.5",
        "focus-within:border-selection",
        containerClassName,
      )}
    >
      <Search aria-hidden="true" className="h-3 w-3 shrink-0 text-text-tertiary" />
      <input
        ref={ref}
        type="search"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-xs text-text-strong outline-none",
          "placeholder:text-text-disabled",
          "[&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />
      {shortcutHint !== undefined && shortcutHint !== null ? (
        <span
          aria-hidden="true"
          className="ml-auto shrink-0 font-mono text-2xs text-text-disabled"
        >
          {shortcutHint}
        </span>
      ) : null}
    </label>
  ),
);
SearchField.displayName = "SearchField";
