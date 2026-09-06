import { useState, type ReactElement } from "react";
import type {
  PcbCopperLayerId,
  PcbFreeHole,
  PcbFreePad,
  PcbOverlayText,
} from "../../../../sdks";
import { PropertyGrid, PropertyRow } from "@shared/frontend/ui/property-grid";
import { PanelSectionHeader } from "@shared/frontend/ui/panel-section-header";
import { Button } from "@shared/frontend/ui/button";

type PcbOverlayLayer =
  | "F.SilkS"
  | "B.SilkS"
  | "F.Fab"
  | "B.Fab"
  | "F.CrtYd"
  | "B.CrtYd"
  | "Edge.Cuts";

export type PcbInspectorSelection =
  | { kind: "freeHole"; hole: PcbFreeHole }
  | { kind: "freePad"; pad: PcbFreePad }
  | { kind: "overlayText"; text: PcbOverlayText }
  | null;

const FIELD_CLASS =
  "h-[18px] w-full min-w-0 rounded-control border border-border-control bg-surface-input px-1 text-xs text-text-strong outline-none focus:border-selection";

/**
 * Edit-then-commit numeric field. Escape reverts to the committed value
 * without dispatching; Enter (via blur) and blur commit.
 */
export function NumericField({
  label,
  value,
  unit,
  onCommit,
  min,
  step,
  readOnly = false,
}: {
  label: string;
  value: number;
  unit?: string;
  onCommit(v: number): void;
  min?: number;
  step?: number;
  /** Renders the value as plain text (no editable affordance). */
  readOnly?: boolean;
}): ReactElement {
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = draft ?? String(value);

  const commit = () => {
    const n = Number(draft ?? value);
    setDraft(null);
    if (Number.isFinite(n) && (min === undefined || n >= min) && n > 0) {
      onCommit(n);
    }
  };

  if (readOnly) {
    return (
      <PropertyRow label={label} mono hint={unit}>
        {value}
      </PropertyRow>
    );
  }

  return (
    <PropertyRow label={label} mono hint={unit}>
      <input
        type="number"
        value={displayValue}
        min={min}
        step={step ?? 0.1}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraft(null);
          }
        }}
        className={`${FIELD_CLASS} text-right`}
      />
    </PropertyRow>
  );
}

function DeleteRow({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => void;
}): ReactElement {
  return (
    <div className="flex items-center px-2 py-2">
      <Button variant="danger" size="sm" className="w-full" onClick={onDelete}>
        {label}
      </Button>
    </div>
  );
}

export function FreeHolePanel({
  hole,
  onUpdate,
  onDelete,
}: {
  hole: PcbFreeHole;
  onUpdate: (patch: { drillMm?: number }) => Promise<void>;
  onDelete: () => Promise<void>;
}): ReactElement {
  return (
    <div className="flex flex-col">
      <PanelSectionHeader variant="uppercase" title="Hole" />
      <PropertyGrid>
        <NumericField
          label="Drill"
          value={hole.drillMm}
          unit="mm"
          min={0.1}
          step={0.1}
          onCommit={(v) => void onUpdate({ drillMm: v })}
        />
        {/* Position is read-only until a move command exists for free holes. */}
        <NumericField
          label="X"
          value={hole.centerMm.x}
          unit="mm"
          readOnly
          onCommit={() => {}}
        />
        <NumericField
          label="Y"
          value={hole.centerMm.y}
          unit="mm"
          readOnly
          onCommit={() => {}}
        />
      </PropertyGrid>
      <DeleteRow label="Delete hole" onDelete={() => void onDelete()} />
    </div>
  );
}

const PAD_SHAPES = ["rect", "circle", "oval", "roundrect"] as const;
const COPPER_LAYERS: PcbCopperLayerId[] = ["F.Cu", "B.Cu", "In1.Cu", "In2.Cu"];

export function FreePadPanel({
  pad,
  onUpdate,
  onDelete,
}: {
  pad: PcbFreePad;
  onUpdate: (patch: {
    widthMm?: number;
    heightMm?: number;
    shape?: "rect" | "circle" | "oval" | "roundrect";
    layer?: PcbCopperLayerId;
    drillMm?: number | null;
    rotationDeg?: number;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}): ReactElement {
  return (
    <div className="flex flex-col">
      <PanelSectionHeader variant="uppercase" title="Pad" />
      <PropertyGrid>
        <PropertyRow label="Shape">
          <select
            value={pad.shape}
            aria-label="Shape"
            onChange={(e) =>
              void onUpdate({
                shape: e.target.value as
                  | "rect"
                  | "circle"
                  | "oval"
                  | "roundrect",
              })
            }
            className={FIELD_CLASS}
          >
            {PAD_SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </PropertyRow>
        <NumericField
          label="Width"
          value={pad.widthMm}
          unit="mm"
          min={0.05}
          step={0.1}
          onCommit={(v) => void onUpdate({ widthMm: v })}
        />
        <NumericField
          label="Height"
          value={pad.heightMm}
          unit="mm"
          min={0.05}
          step={0.1}
          onCommit={(v) => void onUpdate({ heightMm: v })}
        />
        <NumericField
          label="Rotation"
          value={pad.rotationDeg}
          unit="°"
          step={45}
          onCommit={(v) => void onUpdate({ rotationDeg: v })}
        />
        <PropertyRow label="Layer">
          <select
            value={pad.layer}
            aria-label="Layer"
            onChange={(e) =>
              void onUpdate({ layer: e.target.value as PcbCopperLayerId })
            }
            className={FIELD_CLASS}
          >
            {COPPER_LAYERS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </PropertyRow>
        {pad.padType === "hole" || pad.padType === "std" ? (
          <NumericField
            label="Drill"
            value={pad.drillMm ?? 0.8}
            unit="mm"
            min={0.1}
            step={0.1}
            onCommit={(v) => void onUpdate({ drillMm: v })}
          />
        ) : null}
      </PropertyGrid>
      <DeleteRow label="Delete pad" onDelete={() => void onDelete()} />
    </div>
  );
}

const OVERLAY_TEXT_LAYERS: Array<{ value: PcbOverlayLayer; label: string }> = [
  { value: "F.SilkS", label: "Top Overlay (F.SilkS)" },
  { value: "B.SilkS", label: "Bottom Overlay (B.SilkS)" },
];

export function OverlayTextPanel({
  text,
  onUpdate,
  onDelete,
}: {
  text: PcbOverlayText;
  onUpdate: (patch: {
    text?: string;
    fontSizeMm?: number;
    layer?: PcbOverlayLayer;
    rotationDeg?: number;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}): ReactElement {
  const [textDraft, setTextDraft] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <PanelSectionHeader variant="uppercase" title="Text" />
      <PropertyGrid>
        <PropertyRow label="Text">
          <input
            type="text"
            aria-label="Text"
            value={textDraft ?? text.text}
            onChange={(e) => setTextDraft(e.target.value)}
            onBlur={() => {
              const val = textDraft?.trim();
              setTextDraft(null);
              if (val !== undefined && val.length > 0 && val !== text.text) {
                void onUpdate({ text: val });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              else if (e.key === "Escape") setTextDraft(null);
            }}
            className={FIELD_CLASS}
          />
        </PropertyRow>
        <NumericField
          label="Font size"
          value={text.fontSizeMm}
          unit="mm"
          min={0.2}
          step={0.2}
          onCommit={(v) => void onUpdate({ fontSizeMm: v })}
        />
        <PropertyRow label="Layer">
          <select
            value={text.layer}
            aria-label="Layer"
            onChange={(e) =>
              void onUpdate({ layer: e.target.value as PcbOverlayLayer })
            }
            className={FIELD_CLASS}
          >
            {OVERLAY_TEXT_LAYERS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </PropertyRow>
        <NumericField
          label="Rotation"
          value={text.rotationDeg}
          unit="°"
          step={45}
          onCommit={(v) => void onUpdate({ rotationDeg: v })}
        />
      </PropertyGrid>
      <DeleteRow label="Delete text" onDelete={() => void onDelete()} />
    </div>
  );
}
