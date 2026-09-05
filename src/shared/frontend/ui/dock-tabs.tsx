import * as React from "react";
import { cn } from "@/lib/utils";

export interface DockTabItem<T> {
  id: T;
  label: React.ReactNode;
  badge?: number | string;
  /** Class for the badge (e.g. a status colour). */
  badgeClassName?: string;
  disabled?: boolean;
}

export interface DockTabsProps<T> {
  tabs: ReadonlyArray<DockTabItem<T>>;
  active: T;
  onChange: (id: T) => void;
  className?: string;
  tabClassName?: string;
  /** Rendered after the tabs (right-aligned controls such as a close button). */
  trailing?: React.ReactNode;
  "aria-label"?: string;
}

/** 24px tab strip on top of a docked panel (design D2 §7). */
export function DockTabs<T extends string | number>({
  tabs,
  active,
  onChange,
  className,
  tabClassName,
  trailing,
  "aria-label": ariaLabel,
}: DockTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex h-[24px] shrink-0 items-stretch border-b border-border bg-surface-app",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={String(tab.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 border-r border-border px-3 text-xs whitespace-nowrap transition-colors outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "bg-surface-panel font-medium text-text-strong"
                : "text-text-tertiary hover:text-text",
              tabClassName,
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null ? (
              <span
                className={cn(
                  "font-mono text-2xs tabular-nums text-text-tertiary",
                  tab.badgeClassName,
                )}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
      {trailing ? (
        <div className="ml-auto flex items-center gap-1 px-2">{trailing}</div>
      ) : null}
    </div>
  );
}
