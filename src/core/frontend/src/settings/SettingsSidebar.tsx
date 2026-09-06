import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  SETTINGS_NAV,
  type SettingsNavGroup,
  type SettingsTab,
} from "./settings-nav.config";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
  // Visible tab ids after module/cloud gating.
  visibleTabs: SettingsTab[];
  // Live search query — filters item labels only.
  query: string;
}

export function SettingsSidebar({
  activeTab,
  onSelect,
  visibleTabs,
  query,
}: SettingsSidebarProps) {
  const groups = useMemo<SettingsNavGroup[]>(() => {
    const visible = new Set(visibleTabs);
    const needle = query.trim().toLowerCase();
    return SETTINGS_NAV.map((group) => ({
      label: group.label,
      items: group.items.filter(
        (item) =>
          visible.has(item.id) &&
          (needle === "" || item.label.toLowerCase().includes(needle)),
      ),
    })).filter((group) => group.items.length > 0);
  }, [visibleTabs, query]);

  return (
    <nav
      aria-label="Settings"
      className="w-[210px] flex-shrink-0 overflow-y-auto border-r border-border bg-surface-panel px-[10px] py-[14px]"
    >
      {groups.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-text-tertiary">No matches</p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="mb-1 pt-3 first:pt-0">
            <p className="px-2 pb-1 text-2xs font-medium uppercase tracking-wider text-text-caps">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeTab;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => onSelect(item.id)}
                      className={cn(
                        "flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-control px-2 text-sm transition-colors",
                        active
                          ? "bg-surface-selected font-medium text-text-strong shadow-[inset_2px_0_0_var(--selection)]"
                          : "text-text-secondary hover:bg-surface-hover",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-text-strong" : "text-text-tertiary",
                        )}
                        strokeWidth={1.5}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </nav>
  );
}
