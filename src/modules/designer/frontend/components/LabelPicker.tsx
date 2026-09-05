import { useEffect, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

export interface LabelPickerProps {
  title: string;
  subtitle?: string;
  presets?: readonly string[];
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  onPick: (value: string) => void;
  onCancel: () => void;
}

export function LabelPicker({
  title,
  subtitle,
  presets,
  placeholder,
  initialValue = "",
  submitLabel = "OK",
  onPick,
  onCancel,
}: LabelPickerProps): ReactElement {
  const [custom, setCustom] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submitCustom = () => {
    const trimmed = custom.trim();
    if (trimmed.length > 0) onPick(trimmed);
  };

  const view = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-80 rounded-float border border-border bg-surface-raised p-3 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-text-strong">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-xs leading-snug text-text-tertiary">
            {subtitle}
          </p>
        ) : null}

        {presets && presets.length > 0 ? (
          <div className="mt-2.5 grid grid-cols-3 gap-1">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onPick(preset)}
                className="h-[22px] rounded-control border border-border-control bg-surface-input px-2 font-mono text-xs text-text transition-colors hover:border-selection hover:bg-surface-hover hover:text-text-strong"
              >
                {preset}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-2.5 flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitCustom();
              } else if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }
            }}
            placeholder={placeholder}
            className="h-[22px] min-w-0 flex-1 rounded-control border border-border-control bg-surface-input px-1.5 font-mono text-xs text-text-strong outline-none placeholder:text-text-disabled focus:border-selection"
          />
          <button
            type="button"
            onClick={submitCustom}
            disabled={custom.trim().length === 0}
            className="inline-flex h-[22px] shrink-0 items-center rounded-control bg-primary px-[10px] text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-text-tertiary transition-colors hover:text-text-strong"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return view;
  }
  return createPortal(view, document.body);
}

const PRESET_RAILS = ["VCC", "VDD", "+5V", "+3V3", "+12V", "-12V"] as const;

export interface PwrRailPickerProps {
  onPick: (railText: string) => void;
  onCancel: () => void;
}

export function PwrRailPicker({
  onPick,
  onCancel,
}: PwrRailPickerProps): ReactElement {
  return (
    <LabelPicker
      title="Place power port"
      subtitle="Pick a preset rail or type a custom name. The placed port will force its net's name."
      presets={PRESET_RAILS}
      placeholder="Custom rail (e.g. +1V8)"
      onPick={onPick}
      onCancel={onCancel}
    />
  );
}

export interface NetPortalPickerProps {
  onPick: (portalText: string) => void;
  onCancel: () => void;
}

export function NetPortalPicker({
  onPick,
  onCancel,
}: NetPortalPickerProps): ReactElement {
  return (
    <LabelPicker
      title="Place net portal"
      subtitle="Net portals with the same name connect across the schematic."
      placeholder="Net name (e.g. SDA, BUS_OUT)"
      submitLabel="Place"
      onPick={onPick}
      onCancel={onCancel}
    />
  );
}
