import { Tabs, TabsList, TabsTrigger } from "@shared/frontend/ui/tabs";
import { type ReactElement, type ReactNode } from "react";
import type { DesignerDesignSummary } from "../../../../sdks/designer";
import type { DesignerView } from "../types";
import { DesignTabs } from "./DesignTabs";

interface DesignerHeaderProps {
  activeView: DesignerView;
  designs: DesignerDesignSummary[];
  openDesignIds: string[];
  activeDesignId: string | null;
  creatingDesign: boolean;
  onViewChange: (view: DesignerView) => void;
  onActivateTab: (designId: string) => void;
  onCloseTab: (designId: string) => void;
  onCloseOthers: (designId: string) => void;
  onCloseAll: () => void;
  onRenameTab: (designId: string, name: string) => Promise<void> | void;
  onReorderTabs: (fromIndex: number, toIndex: number) => void;
  onCreateDesign: () => void;
  trailing?: ReactNode;
}

/** 34px designer header: design tabs | view tabs | trailing status + actions. */
export function DesignerHeader({
  activeView,
  designs,
  openDesignIds,
  activeDesignId,
  creatingDesign,
  onViewChange,
  onActivateTab,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
  onRenameTab,
  onReorderTabs,
  onCreateDesign,
  trailing,
}: DesignerHeaderProps): ReactElement {
  return (
    <header className="grid h-[34px] shrink-0 grid-cols-[1fr_auto_1fr] items-stretch border-b border-border bg-surface-rail">
      <div className="flex min-w-0 items-stretch">
        <DesignTabs
          designs={designs}
          openDesignIds={openDesignIds}
          activeDesignId={activeDesignId}
          creatingDesign={creatingDesign}
          onActivate={onActivateTab}
          onClose={onCloseTab}
          onCloseOthers={onCloseOthers}
          onCloseAll={onCloseAll}
          onRename={onRenameTab}
          onReorder={onReorderTabs}
          onCreate={onCreateDesign}
        />
      </div>

      <Tabs
        value={activeView}
        onValueChange={(value) => onViewChange(value as DesignerView)}
        className="flex items-stretch"
      >
        <TabsList className="h-[34px]">
          <TabsTrigger value="schem" className="cursor-pointer px-3.5">
            Schem
          </TabsTrigger>
          <TabsTrigger value="pcb" className="cursor-pointer px-3.5">
            PCB
          </TabsTrigger>
          <TabsTrigger
            value="3d"
            className="cursor-pointer px-3.5"
            data-testid="designer-view-3d"
          >
            3D
          </TabsTrigger>
          <TabsTrigger value="bom" className="cursor-pointer px-3.5">
            BOM
          </TabsTrigger>
          <TabsTrigger value="drc" className="cursor-pointer px-3.5">
            DRC
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-end gap-2 px-2">{trailing}</div>
    </header>
  );
}
