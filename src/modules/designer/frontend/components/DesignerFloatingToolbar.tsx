import {
  ArrowRightFromLine,
  ChevronsDown,
  MessageSquarePlus,
  Minus,
  Plus,
  ScanSearch,
  Search,
  Undo2,
  Redo2,
  Zap,
} from "lucide-react";
import type { ReactElement } from "react";
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from "@shared/frontend/ui/toolbar";

interface SchematicToolbarProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onPlaceComponent?: () => void;
  onPlaceGnd?: () => void;
  onPlacePwr?: () => void;
  onPlaceNetPortal?: () => void;
  commentMode?: boolean;
  onToggleCommentMode?: () => void;
}

/**
 * The schematic editor's docked 30px tool row (design D2 §4). Accessible names
 * and tooltips are frozen — "Fit schematic", "Undo" and "Redo" are e2e
 * locators.
 */
export function SchematicToolbar({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onPlaceComponent,
  onPlaceGnd,
  onPlacePwr,
  onPlaceNetPortal,
  commentMode = false,
  onToggleCommentMode,
}: SchematicToolbarProps): ReactElement {
  return (
    <Toolbar aria-label="Schematic tools">
      <ToolbarButton
        label="Undo"
        icon={<Undo2 />}
        onClick={onUndo}
        disabled={!canUndo}
      />
      <ToolbarButton
        label="Redo"
        icon={<Redo2 />}
        onClick={onRedo}
        disabled={!canRedo}
      />

      <ToolbarSeparator />

      <ToolbarButton
        label="Fit schematic"
        title="Fit"
        icon={<ScanSearch />}
        onClick={onFit}
      />
      <ToolbarButton label="Zoom out" icon={<Minus />} onClick={onZoomOut} />
      <ToolbarButton label="Zoom in" icon={<Plus />} onClick={onZoomIn} />

      {onPlaceComponent || onPlaceGnd || onPlacePwr || onPlaceNetPortal ? (
        <ToolbarSeparator />
      ) : null}

      {onPlaceComponent ? (
        <ToolbarButton
          label="Place component"
          title="Place component (⌘/Ctrl K)"
          icon={<Search />}
          onClick={onPlaceComponent}
        >
          Components
        </ToolbarButton>
      ) : null}
      {onPlaceGnd ? (
        <ToolbarButton
          label="Place GND port"
          title="Place GND port (G)"
          icon={<ChevronsDown />}
          onClick={onPlaceGnd}
        >
          GND
        </ToolbarButton>
      ) : null}
      {onPlacePwr ? (
        <ToolbarButton
          label="Place power port"
          title="Place power port (P)"
          icon={<Zap />}
          onClick={onPlacePwr}
        >
          PWR
        </ToolbarButton>
      ) : null}
      {onPlaceNetPortal ? (
        <ToolbarButton
          label="Place net portal"
          title="Place net portal (H)"
          icon={<ArrowRightFromLine />}
          onClick={onPlaceNetPortal}
        >
          Portal
        </ToolbarButton>
      ) : null}

      {onToggleCommentMode ? (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            label="Comment"
            title="Comment (C)"
            icon={<MessageSquarePlus />}
            pressable
            active={commentMode}
            onClick={onToggleCommentMode}
          >
            Comment
          </ToolbarButton>
        </>
      ) : null}
    </Toolbar>
  );
}

/** Legacy name kept so existing imports keep resolving. */
export const DesignerFloatingToolbar = SchematicToolbar;
