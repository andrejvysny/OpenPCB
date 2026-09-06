import type { PointerEvent as ReactPointerEvent, ReactElement, ReactNode } from "react";
import { DockTabs, type DockTabItem } from "@shared/frontend/ui/dock-tabs";
import type { DockTab } from "../stores/designer-dock-prefs";

export type { DockTab };

export interface DesignerRightDockProps {
  tabs: ReadonlyArray<DockTabItem<DockTab>>;
  activeTab: DockTab;
  onTabChange: (tab: DockTab) => void;
  /** Clamped to the dock bounds by the owner. */
  width: number;
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
  /** Body for `activeTab`. */
  children: ReactNode;
}

/**
 * The designer's single right dock. Replaces the three stacked docks
 * (selection inspector / DRC results / assistant chat) with one tabbed column
 * whose tab set depends on the active view.
 *
 * The dock has no close affordance of its own — the header's "Toggle side
 * panel" button (and ⌘/Ctrl+.) is the single control, so there is exactly one
 * place to look for it.
 */
export function DesignerRightDock({
  tabs,
  activeTab,
  onTabChange,
  width,
  onResizeStart,
  children,
}: DesignerRightDockProps): ReactElement {
  return (
    <>
      <div
        className="group relative w-px shrink-0 cursor-col-resize bg-border transition-colors hover:bg-selection"
        onPointerDown={onResizeStart}
        role="separator"
        aria-orientation="vertical"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>
      <aside
        style={{ width }}
        className="flex min-h-0 shrink-0 flex-col overflow-hidden border-l border-border bg-surface-panel"
      >
        <DockTabs
          aria-label="Side panel"
          tabs={tabs}
          active={activeTab}
          onChange={onTabChange}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </aside>
    </>
  );
}
