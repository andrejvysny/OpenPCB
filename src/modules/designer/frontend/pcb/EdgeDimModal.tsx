import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { PcbBoardOutline } from "../../../../sdks";
import { Button } from "../../../../shared/frontend/ui/button";
import { outlineVertices, type EditableOutline } from "./pcb-outline-edit";
import { setEdgeLength, setVertexPosition } from "./outline-dimension-edit";

export type DimEditTarget =
  | { kind: "edge-length"; outline: EditableOutline; edgeIndex: number }
  | { kind: "vertex-xy"; outline: EditableOutline; vIndex: number };

interface EdgeDimModalProps {
  target: DimEditTarget;
  /** Live-preview outline (null clears it). */
  onPreview: (outline: PcbBoardOutline | null) => void;
  onApply: (outline: PcbBoardOutline) => void;
  onClose: () => void;
}

function round3(n: number): string {
  return (Math.round(n * 1000) / 1000).toString();
}

const INPUT_CLASS =
  "h-8 w-full rounded-control border border-border-control bg-surface-input pl-2 pr-8 text-sm text-text-primary outline-none focus:border-accent";
const SUFFIX_CLASS =
  "pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-text-tertiary";

/**
 * Numeric editor for an existing board outline: retype an edge length (slides
 * the far endpoint) or a vertex position (X,Y). Live preview + disabled state
 * when the change can't apply (arc-adjacent vertex), mirroring CornerOpModal.
 */
export function EdgeDimModal({
  target,
  onPreview,
  onApply,
  onClose,
}: EdgeDimModalProps): ReactElement {
  const verts = outlineVertices(target.outline);
  const n = verts.length;

  const seed = useMemo(() => {
    if (target.kind === "edge-length") {
      const a = verts[target.edgeIndex]!;
      const b = verts[(target.edgeIndex + 1) % n]!;
      return { len: Math.hypot(b.x - a.x, b.y - a.y), x: 0, y: 0 };
    }
    const v = verts[target.vIndex]!;
    return { len: 0, x: v.x, y: v.y };
    // verts is derived from target.outline; keying on target is sufficient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const [lenText, setLenText] = useState(
    target.kind === "edge-length" ? round3(seed.len) : "",
  );
  const [xText, setXText] = useState(
    target.kind === "vertex-xy" ? round3(seed.x) : "",
  );
  const [yText, setYText] = useState(
    target.kind === "vertex-xy" ? round3(seed.y) : "",
  );

  const result = useMemo<PcbBoardOutline | null>(() => {
    if (target.kind === "edge-length") {
      const v = Number.parseFloat(lenText);
      if (!Number.isFinite(v)) return null;
      return setEdgeLength(target.outline, target.edgeIndex, v);
    }
    const x = Number.parseFloat(xText);
    const y = Number.parseFloat(yText);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return setVertexPosition(target.outline, target.vIndex, { x, y });
  }, [target, lenText, xText, yText]);

  useEffect(() => {
    onPreview(result);
    return () => onPreview(null);
  }, [onPreview, result]);

  const commit = (): void => {
    if (result) {
      onApply(result);
      onClose();
    }
  };
  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && result) commit();
    if (e.key === "Escape") onClose();
  };

  const hasInput =
    target.kind === "edge-length"
      ? lenText !== ""
      : xText !== "" && yText !== "";
  const invalid = hasInput && result === null;
  const title =
    target.kind === "edge-length" ? "Set edge length" : "Set vertex position";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[300px] rounded-card border border-border bg-surface-raised p-4 shadow-xl">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">{title}</h2>
        {target.kind === "edge-length" ? (
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
            Length
            <div className="relative">
              <input
                autoFocus
                value={lenText}
                inputMode="decimal"
                onChange={(e) => setLenText(e.target.value)}
                onKeyDown={onKeyDown}
                className={INPUT_CLASS}
              />
              <span className={SUFFIX_CLASS}>mm</span>
            </div>
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              X
              <div className="relative">
                <input
                  autoFocus
                  value={xText}
                  inputMode="decimal"
                  onChange={(e) => setXText(e.target.value)}
                  onKeyDown={onKeyDown}
                  className={INPUT_CLASS}
                />
                <span className={SUFFIX_CLASS}>mm</span>
              </div>
            </label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              Y
              <div className="relative">
                <input
                  value={yText}
                  inputMode="decimal"
                  onChange={(e) => setYText(e.target.value)}
                  onKeyDown={onKeyDown}
                  className={INPUT_CLASS}
                />
                <span className={SUFFIX_CLASS}>mm</span>
              </div>
            </label>
          </div>
        )}
        {invalid ? (
          <p className="mt-2 text-[11px] text-status-warning">
            {target.kind === "edge-length"
              ? "Can't resize this edge (touches an arc corner)."
              : "Can't move this vertex (touches an arc corner)."}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!result}
            onClick={commit}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
