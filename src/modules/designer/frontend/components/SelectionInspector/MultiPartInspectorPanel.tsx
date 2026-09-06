import { useCallback, useMemo, useState, type ReactElement } from "react";
import { Trash2 } from "lucide-react";
import type { DesignerPlacedPart } from "../../../../../sdks";
import type { DesignerWorkspaceActions } from "../../hooks/useDesignerWorkspace";
import { Button } from "@shared/frontend/ui/button";
import { PanelSectionHeader } from "@shared/frontend/ui/panel-section-header";
import { PropertyGrid, PropertyRow } from "@shared/frontend/ui/property-grid";

const INPUT_CLASS =
  "h-[22px] w-full rounded-control border border-border-control bg-surface-input px-1.5 text-xs text-text-strong outline-none placeholder:text-text-disabled focus:border-selection";

interface MultiPartInspectorPanelProps {
  parts: DesignerPlacedPart[];
  dispatchCommand: DesignerWorkspaceActions["dispatchCommand"];
  setError: DesignerWorkspaceActions["setError"];
}

export function MultiPartInspectorPanel({
  parts,
  dispatchCommand,
  setError,
}: MultiPartInspectorPanelProps): ReactElement {
  const [batchValue, setBatchValue] = useState("");

  const commonComponentId = useMemo(() => {
    const first = parts[0]?.componentId;
    if (!first) return null;
    return parts.every((part) => part.componentId === first) ? first : null;
  }, [parts]);

  const applyBatchValue = useCallback(async () => {
    if (!batchValue.trim()) return;
    try {
      await dispatchCommand({
        type: "update_parts_properties",
        partIds: parts.map((part) => part.id),
        value: batchValue.trim(),
      });
      setBatchValue("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to batch edit");
    }
  }, [batchValue, parts, dispatchCommand, setError]);

  const deleteAll = useCallback(async () => {
    for (const part of parts) {
      try {
        await dispatchCommand({
          type: "delete_entity",
          entityId: part.id,
          entityKind: "part",
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to delete");
        return;
      }
    }
  }, [parts, dispatchCommand, setError]);

  return (
    <div className="flex flex-col">
      <PanelSectionHeader
        variant="uppercase"
        title="Selection"
        count={parts.length}
      />
      <PropertyGrid>
        <PropertyRow label="Parts" mono>
          {parts.length}
        </PropertyRow>
        <PropertyRow label="Type">
          {commonComponentId ? "Same component" : "Mixed components"}
        </PropertyRow>
      </PropertyGrid>

      <PanelSectionHeader variant="uppercase" title="Batch edit" />
      <div className="flex flex-col gap-1.5 border-b border-border p-2">
        <div className="flex items-center gap-1.5">
          <input
            value={batchValue}
            onChange={(event) => setBatchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void applyBatchValue();
            }}
            aria-label="Set Value (batch)"
            placeholder="e.g. 10nF"
            className={INPUT_CLASS}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => void applyBatchValue()}
          >
            Apply
          </Button>
        </div>
        <Button
          variant="danger"
          size="sm"
          className="justify-center"
          onClick={() => void deleteAll()}
          icon={<Trash2 className="h-3 w-3" />}
        >
          Delete all {parts.length}
        </Button>
      </div>
    </div>
  );
}
