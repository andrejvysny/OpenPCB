import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Trash2 } from "lucide-react";
import type {
  DesignerLabel,
  DesignerSchematicProjection,
} from "../../../../../sdks";
import type { DesignerWorkspaceActions } from "../../hooks/useDesignerWorkspace";
import { Button } from "@shared/frontend/ui/button";
import { PanelSectionHeader } from "@shared/frontend/ui/panel-section-header";
import { PropertyGrid, PropertyRow } from "@shared/frontend/ui/property-grid";

const INPUT_CLASS =
  "h-[22px] w-full rounded-control border border-border-control bg-surface-input px-1.5 text-xs text-text-strong outline-none placeholder:text-text-disabled focus:border-selection";

interface LabelInspectorPanelProps {
  label: DesignerLabel;
  projection: DesignerSchematicProjection;
  dispatchCommand: DesignerWorkspaceActions["dispatchCommand"];
  setError: DesignerWorkspaceActions["setError"];
}

export function LabelInspectorPanel({
  label,
  projection,
  dispatchCommand,
  setError,
}: LabelInspectorPanelProps): ReactElement {
  const [textDraft, setTextDraft] = useState(label.text);

  useEffect(() => {
    setTextDraft(label.text);
  }, [label.text]);

  const memberNet = projection.nets.find((net) =>
    net.labelIds.includes(label.id),
  );

  const commitText = useCallback(async () => {
    const trimmed = textDraft.trim();
    if (trimmed.length === 0 || trimmed === label.text) {
      setTextDraft(label.text);
      return;
    }
    try {
      await dispatchCommand({
        type: "upsert_label",
        labelId: label.id,
        text: trimmed,
        positionNm: label.positionNm,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update label",
      );
      setTextDraft(label.text);
    }
  }, [
    dispatchCommand,
    label.id,
    label.positionNm,
    label.text,
    setError,
    textDraft,
  ]);

  const deleteLabel = useCallback(async () => {
    try {
      await dispatchCommand({
        type: "delete_entity",
        entityId: label.id,
        entityKind: "label",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete label",
      );
    }
  }, [dispatchCommand, label.id, setError]);

  return (
    <div className="flex flex-col">
      <PanelSectionHeader variant="uppercase" title="Label" />
      <PropertyGrid>
        <PropertyRow label="Text" className="h-[26px]">
          <input
            value={textDraft}
            onChange={(event) => setTextDraft(event.target.value)}
            onBlur={() => void commitText()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            aria-label="Text"
            className={INPUT_CLASS}
          />
        </PropertyRow>
        <PropertyRow label="Net" mono>
          {memberNet ? memberNet.name : "Unconnected"}
        </PropertyRow>
        <PropertyRow label="X" mono hint="mm">
          {(label.positionNm.x / 1_000_000).toFixed(3)}
        </PropertyRow>
        <PropertyRow label="Y" mono hint="mm">
          {(label.positionNm.y / 1_000_000).toFixed(3)}
        </PropertyRow>
      </PropertyGrid>

      <div className="flex flex-col border-b border-border p-2">
        <Button
          variant="danger"
          size="sm"
          className="justify-center"
          onClick={() => void deleteLabel()}
          icon={<Trash2 className="h-3 w-3" />}
        >
          Delete label
        </Button>
      </div>
    </div>
  );
}
