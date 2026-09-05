import type { ReactElement } from "react";
import type {
  DesignerWorkspaceActions,
  DesignerWorkspaceState,
} from "../hooks/useDesignerWorkspace";
import type { DesignerView } from "../types";
import { OutlinePanel } from "./OutlinePanel/OutlinePanel";
import { CollapsibleSection } from "./CollapsibleSection";

export const COMPONENT_DND_MIME = "application/x-openpcb-component-id";

interface DesignerSidebarProps {
  state: DesignerWorkspaceState;
  actions: DesignerWorkspaceActions;
  activeView: DesignerView;
  pcbLayersSlotRef?: (el: HTMLDivElement | null) => void;
  threeDSlotRef?: (el: HTMLDivElement | null) => void;
  onPlaceComponent(): void;
  onAddNetLabel(): void;
  onBrowseLibrary(): void;
  onFrameBoundsMm(bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }): void;
  onSelectOnCanvas(sel: {
    partIds?: string[];
    wireIds?: string[];
    labelIds?: string[];
  }): void;
}

const ASIDE_CLASS =
  "flex h-full min-h-0 flex-col border-r border-border bg-surface-panel";

export function DesignerSidebar({
  state,
  actions,
  activeView,
  pcbLayersSlotRef,
  threeDSlotRef,
  onPlaceComponent,
  onAddNetLabel,
  onBrowseLibrary,
  onFrameBoundsMm,
  onSelectOnCanvas,
}: DesignerSidebarProps): ReactElement {
  if (activeView === "pcb") {
    // Board settings moved into the right dock's Properties tab (its idle
    // state), so the PCB sidebar hosts Layers alone.
    return (
      <aside className={`${ASIDE_CLASS} overflow-y-auto`}>
        <CollapsibleSection id="pcb.sidebar.layers" title="Layers" defaultOpen>
          <div ref={pcbLayersSlotRef} />
        </CollapsibleSection>
      </aside>
    );
  }

  if (activeView === "3d") {
    return (
      <aside className={`${ASIDE_CLASS} overflow-hidden`}>
        <div ref={threeDSlotRef} className="min-h-0 flex-1" />
      </aside>
    );
  }

  if (activeView !== "schem") {
    return <aside className={ASIDE_CLASS} />;
  }

  return (
    <OutlinePanel
      state={state}
      actions={actions}
      onPlaceComponent={onPlaceComponent}
      onAddNetLabel={onAddNetLabel}
      onBrowseLibrary={onBrowseLibrary}
      onFrameBoundsMm={onFrameBoundsMm}
      onSelectOnCanvas={onSelectOnCanvas}
    />
  );
}
