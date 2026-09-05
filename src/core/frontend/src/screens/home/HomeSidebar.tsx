import { Archive, Clock, HardDrive, LayoutGrid, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/cloud/AuthProvider";
import { useCloudPrefs } from "@/cloud/cloud-prefs";
import { useFeatureFlag } from "@/feature-flags";
import { useNavigationStore } from "../../stores/navigation-store";

export type HomeFilterKey = "all" | "recent" | "starred" | "archived";

const FILTERS: {
  key: HomeFilterKey;
  label: string;
  Icon: typeof LayoutGrid;
}[] = [
  { key: "all", label: "All designs", Icon: LayoutGrid },
  { key: "recent", label: "Recent", Icon: Clock },
  { key: "starred", label: "Starred", Icon: Star },
  { key: "archived", label: "Archived", Icon: Archive },
];

/**
 * Cloud-sync state for the sidebar footer — the relocated `CloudSyncPill`
 * logic (real auth + the project-sync setting), opening Settings → Account on
 * click. When cloud is off or the `cloud.sync` flag is disabled the footer
 * degrades to a plain "Local" marker with no sign-in affordance.
 */
function SyncFooter() {
  const { enabled, session } = useAuth();
  const syncOn = useCloudPrefs((s) => s.projectSyncEnabled);
  const openSettings = useNavigationStore((s) => s.openSettings);
  const syncFeatureEnabled = useFeatureFlag("cloud.sync");

  const cloudAvailable = enabled && syncFeatureEnabled;
  const status = !cloudAvailable
    ? "Local"
    : !session
      ? "Local only — not signed in"
      : syncOn
        ? "Cloud sync on"
        : "Sync off";
  const actionLabel = !session ? "Sign in to sync" : "Manage sync";
  const title = !session
    ? "Sign in to enable cloud sync"
    : syncOn
      ? "Cloud sync is on — manage in Settings → Account"
      : "Project sync is off — manage in Settings → Account";

  return (
    <div className="shrink-0 border-t border-border p-2 text-2xs text-text-tertiary">
      <div className="flex items-center gap-1.5">
        <HardDrive aria-hidden="true" className="h-3 w-3 shrink-0" />
        <span className="min-w-0 truncate">{status}</span>
      </div>
      {cloudAvailable ? (
        <button
          type="button"
          title={title}
          onClick={() => openSettings("account")}
          className="mt-1 text-text-secondary underline outline-none hover:text-text-strong"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export interface HomeSidebarProps {
  filter: HomeFilterKey;
  onFilterChange: (filter: HomeFilterKey) => void;
  counts: Record<HomeFilterKey, number>;
}

/** 200px filters rail (design D3 §4). */
export function HomeSidebar({
  filter,
  onFilterChange,
  counts,
}: HomeSidebarProps) {
  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-border bg-surface-panel">
      <nav className="min-h-0 flex-1 overflow-auto py-1">
        {FILTERS.map(({ key, label, Icon }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onFilterChange(key)}
              className={cn(
                "flex h-[24px] w-full items-center gap-2 px-[10px] text-left text-xs outline-none",
                active
                  ? "bg-surface-selected text-text-strong shadow-[inset_2px_0_0_var(--selection)]"
                  : "text-text hover:bg-surface-hover",
              )}
            >
              <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className="shrink-0 font-mono text-2xs tabular-nums text-text-disabled">
                {counts[key]}
              </span>
            </button>
          );
        })}
      </nav>
      <SyncFooter />
    </aside>
  );
}
