import { useCallback, useRef, useState, type ReactElement } from "react";
import type { PcbBoardOutline } from "../../../../../sdks";
import type {
  DxfInspectResult,
  DxfLoopCandidate,
} from "../../../backend/import/dxf/to-outline";
import { Button } from "../../../../../shared/frontend/ui/button";

interface DxfImportModalProps {
  backendURL: string | null;
  /** Apply the chosen loop's contour (dispatches `pcb_set_board_outline`). */
  onApply: (outline: PcbBoardOutline) => void;
  onClose: () => void;
}

/**
 * DXF → board outline import. Reads a `.dxf` client-side, POSTs it to the
 * read-only inspect endpoint, lets the user pick which closed loop becomes the
 * outline (never silently guesses when several exist), then applies it through
 * the normal outline command. Inner loops are surfaced but not imported in v1.
 */
export function DxfImportModal({
  backendURL,
  onApply,
  onClose,
}: DxfImportModalProps): ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<DxfInspectResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [unitOverride, setUnitOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inspect = useCallback(
    async (content: string, unitScaleMm?: number) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `${backendURL ?? ""}/api/modules/designer/imports/dxf/inspect`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content,
              ...(unitScaleMm ? { unitScaleMm } : {}),
            }),
          },
        );
        if (!res.ok) {
          const problem = await res.json().catch(() => null);
          throw new Error(problem?.detail ?? `Inspect failed (${res.status})`);
        }
        const body = (await res.json()) as { data: { result: DxfInspectResult } };
        const r = body.data.result;
        setResult(r);
        // Auto-select only when there is a single valid loop; with several the
        // user must pick explicitly (never silently overwrite with a guess).
        const validLoops = r.loops.filter((l) => l.valid);
        setSelected(validLoops.length === 1 ? validLoops[0]!.index : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "DXF inspect failed");
        setResult(null);
      } finally {
        setBusy(false);
      }
    },
    [backendURL],
  );

  const onFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      contentRef.current = text;
      setFileName(file.name);
      await inspect(text);
    },
    [inspect],
  );

  const reInspect = useCallback(() => {
    const scale = Number.parseFloat(unitOverride);
    if (contentRef.current && Number.isFinite(scale) && scale > 0) {
      void inspect(contentRef.current, scale);
    }
  }, [inspect, unitOverride]);

  const chosen: DxfLoopCandidate | null =
    result && selected !== null
      ? (result.loops.find((l) => l.index === selected) ?? null)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[440px] max-w-[92vw] rounded-card border border-border bg-surface-raised p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Import board outline from DXF
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-text-tertiary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {!result ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-control border border-dashed border-border-control px-3 py-6 text-center text-xs text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {busy ? "Reading…" : "Choose a .dxf file"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".dxf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-[11px] text-text-tertiary">
              {fileName} · units: {result.detectedUnits} · scale{" "}
              {result.unitScaleMm} mm/unit
            </div>

            <div className="flex items-end gap-2">
              <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                Override mm/unit
                <input
                  value={unitOverride}
                  inputMode="decimal"
                  onChange={(e) => setUnitOverride(e.target.value)}
                  placeholder="auto"
                  className="h-8 w-28 rounded-control border border-border-control bg-surface-input px-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>
              <Button variant="secondary" size="sm" disabled={busy} onClick={reInspect}>
                Re-scale
              </Button>
            </div>

            <div className="max-h-52 overflow-y-auto rounded-control border border-border">
              {result.loops.length === 0 ? (
                <p className="p-3 text-xs text-status-warning">
                  No closed loop found. Check the DXF forms a closed outline.
                </p>
              ) : (
                result.loops.map((loop) => (
                  <label
                    key={loop.index}
                    className={`flex cursor-pointer items-center gap-2 border-b border-border-subtle px-3 py-2 text-xs last:border-b-0 ${
                      loop.valid ? "" : "opacity-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dxf-loop"
                      disabled={!loop.valid}
                      checked={selected === loop.index}
                      onChange={() => setSelected(loop.index)}
                    />
                    <span className="flex-1 text-text-primary">
                      Loop {loop.index + 1} · {loop.role} ·{" "}
                      {loop.widthMm.toFixed(1)} × {loop.heightMm.toFixed(1)} mm
                    </span>
                    <span className="text-text-tertiary">
                      {loop.valid ? `${loop.segmentCount} seg` : "invalid"}
                    </span>
                  </label>
                ))
              )}
            </div>

            {result.diagnostics.length > 0 ? (
              <ul className="max-h-24 list-disc space-y-0.5 overflow-y-auto rounded-control border border-status-warning/30 bg-status-warning-soft px-4 py-1.5 text-[11px] text-status-warning">
                {result.diagnostics.slice(0, 8).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {error ? (
          <p className="mt-3 rounded-control border border-status-danger/40 bg-status-danger-soft px-2 py-1.5 text-xs text-status-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!chosen || !chosen.valid}
            onClick={() => {
              if (chosen) {
                onApply(chosen.outline);
                onClose();
              }
            }}
          >
            Import outline
          </Button>
        </div>
      </div>
    </div>
  );
}
