import { useCallback, useMemo, type ReactElement } from "react";
import { Trash2 } from "lucide-react";
import type {
  DesignerSchematicProjection,
  DesignerWire,
} from "../../../../../sdks";
import { Units } from "../../../../../shared/frontend/canvas/coords";
import type { DesignerWorkspaceActions } from "../../hooks/useDesignerWorkspace";
import { Button } from "@shared/frontend/ui/button";
import { PanelSectionHeader } from "@shared/frontend/ui/panel-section-header";
import { PropertyGrid, PropertyRow } from "@shared/frontend/ui/property-grid";

interface WireInspectorPanelProps {
  wire: DesignerWire;
  projection: DesignerSchematicProjection;
  dispatchCommand: DesignerWorkspaceActions["dispatchCommand"];
  setError: DesignerWorkspaceActions["setError"];
}

export function WireInspectorPanel({
  wire,
  projection,
  dispatchCommand,
  setError,
}: WireInspectorPanelProps): ReactElement {
  const memberNet = useMemo(
    () => projection.nets.find((net) => net.wireIds.includes(wire.id)) ?? null,
    [projection.nets, wire.id],
  );

  const lengthMm = useMemo(() => {
    let total = 0;
    for (let i = 1; i < wire.pointsNm.length; i += 1) {
      const a = wire.pointsNm[i - 1];
      const b = wire.pointsNm[i];
      if (!a || !b) continue;
      total += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return Units.nmToMm(total);
  }, [wire.pointsNm]);

  const deleteWire = useCallback(async () => {
    try {
      await dispatchCommand({
        type: "delete_entity",
        entityId: wire.id,
        entityKind: "wire",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete wire",
      );
    }
  }, [dispatchCommand, wire.id, setError]);

  return (
    <div className="flex flex-col">
      <PanelSectionHeader variant="uppercase" title="Connection" />
      <PropertyGrid>
        <PropertyRow label="Net" mono title={memberNet?.name ?? "Unassigned"}>
          {memberNet?.name ?? "Unassigned"}
        </PropertyRow>
        <PropertyRow label="Length" mono hint="mm">
          {lengthMm.toFixed(2)}
        </PropertyRow>
        <PropertyRow label="Segments" mono>
          {Math.max(wire.pointsNm.length - 1, 0)}
        </PropertyRow>
        {memberNet ? (
          <>
            <PropertyRow label="Pins" mono>
              {memberNet.pinIds.length}
            </PropertyRow>
            <PropertyRow label="Wires" mono>
              {memberNet.wireIds.length}
            </PropertyRow>
          </>
        ) : null}
      </PropertyGrid>

      <div className="flex flex-col border-b border-border p-2">
        <Button
          variant="danger"
          size="sm"
          className="justify-center"
          onClick={() => void deleteWire()}
          icon={<Trash2 className="h-3 w-3" />}
        >
          Delete wire
        </Button>
      </div>
    </div>
  );
}
