import type {
  DesignerDerivedNet,
  DesignerLabel,
  DesignerPlacedPart,
  DesignerPrimitive,
  DesignerSchematicProjection,
  DesignerWire,
} from "../../../../../sdks";
import { Units } from "../../../../../shared/frontend/canvas/coords";

/**
 * Sheet-space (mm) bounding boxes used by every "frame this thing" path in the
 * schematic editor: the outline panel's frame action, the ERC dock's
 * jump-to-violation, and the toolbar's zoom-to-selection. One definition so
 * the three never drift apart.
 */
export interface BoundsMm {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Slack around a framed entity so it never sits flush against the viewport. */
export const FRAME_PADDING_MM = 5;

function padded(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): BoundsMm {
  return {
    minX: minX - FRAME_PADDING_MM,
    minY: minY - FRAME_PADDING_MM,
    maxX: maxX + FRAME_PADDING_MM,
    maxY: maxY + FRAME_PADDING_MM,
  };
}

/** Padded box around a single nanometre point (a pin, a primitive, a vertex). */
export function pointBoundsMm(pointNm: { x: number; y: number }): BoundsMm {
  const x = Units.nmToMm(pointNm.x);
  const y = Units.nmToMm(pointNm.y);
  return padded(x, y, x, y);
}

export function partBoundsMm(part: DesignerPlacedPart): BoundsMm {
  return pointBoundsMm(part.positionNm);
}

export function labelBoundsMm(label: DesignerLabel): BoundsMm {
  return pointBoundsMm(label.positionNm);
}

export function primitiveBoundsMm(primitive: DesignerPrimitive): BoundsMm {
  return pointBoundsMm(primitive.positionNm);
}

export function wireBoundsMm(wire: DesignerWire): BoundsMm | null {
  if (wire.pointsNm.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of wire.pointsNm) {
    const xMm = Units.nmToMm(point.x);
    const yMm = Units.nmToMm(point.y);
    if (xMm < minX) minX = xMm;
    if (yMm < minY) minY = yMm;
    if (xMm > maxX) maxX = xMm;
    if (yMm > maxY) maxY = yMm;
  }
  return padded(minX, minY, maxX, maxY);
}

export function netBoundsMm(
  net: DesignerDerivedNet,
  projection: DesignerSchematicProjection,
): BoundsMm | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let hit = false;
  for (const wireId of net.wireIds) {
    const wire = projection.wires.find((w) => w.id === wireId);
    if (!wire) continue;
    for (const point of wire.pointsNm) {
      const xMm = Units.nmToMm(point.x);
      const yMm = Units.nmToMm(point.y);
      if (xMm < minX) minX = xMm;
      if (yMm < minY) minY = yMm;
      if (xMm > maxX) maxX = xMm;
      if (yMm > maxY) maxY = yMm;
      hit = true;
    }
  }
  for (const pinId of net.pinIds) {
    for (const part of projection.parts) {
      const pin = part.pins.find((p) => p.id === pinId);
      if (!pin) continue;
      const xMm = Units.nmToMm(pin.worldPositionNm.x);
      const yMm = Units.nmToMm(pin.worldPositionNm.y);
      if (xMm < minX) minX = xMm;
      if (yMm < minY) minY = yMm;
      if (xMm > maxX) maxX = xMm;
      if (yMm > maxY) maxY = yMm;
      hit = true;
    }
  }
  if (!hit) return null;
  return padded(minX, minY, maxX, maxY);
}

/**
 * Union of several boxes. Already-padded inputs stay padded — the union is
 * taken as-is rather than re-padding.
 */
export function unionBoundsMm(
  boxes: ReadonlyArray<BoundsMm | null>,
): BoundsMm | null {
  let out: BoundsMm | null = null;
  for (const box of boxes) {
    if (!box) continue;
    out = out
      ? {
          minX: Math.min(out.minX, box.minX),
          minY: Math.min(out.minY, box.minY),
          maxX: Math.max(out.maxX, box.maxX),
          maxY: Math.max(out.maxY, box.maxY),
        }
      : box;
  }
  return out;
}
