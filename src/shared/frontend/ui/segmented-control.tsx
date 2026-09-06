import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Native tooltip; falls back to the label when it is a string. */
  title?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (id: T) => void;
  /** `sm` = 20px (parameter row), `md` = 22px (default). */
  size?: "sm" | "md";
  className?: string;
  optionClassName?: string;
  "aria-label"?: string;
}

/** Flat segmented toggle (design D2 §5, design D3 §5). */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
  className,
  optionClassName,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-stretch overflow-hidden rounded-control border border-border-control",
        size === "sm" ? "h-[20px]" : "h-[22px]",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={String(option.id)}
            type="button"
            disabled={option.disabled}
            aria-pressed={active}
            title={
              option.title ??
              (typeof option.label === "string" ? option.label : undefined)
            }
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex items-center gap-1 px-2 text-2xs whitespace-nowrap transition-colors outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "[&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0",
              active
                ? "bg-surface-control font-medium text-text-strong"
                : "text-text-secondary hover:bg-surface-hover hover:text-text",
              optionClassName,
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
