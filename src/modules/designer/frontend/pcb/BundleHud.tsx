import type { ReactElement } from "react";
import { PcbParamRow } from "./PcbTopToolbar";

export interface BundleHudModel {
  /** Collected pad count. */
  padCount: number;
  /** Distinct net names in the bundle (display order). */
  netNames: string[];
  /** True once the centerline has waypoints (collection locked). */
  routing: boolean;
  pitchMm: number;
  /** Detected `_P/_N` / `+/-` pair (N=2). */
  diffPair: boolean;
}

/**
 * Parameter-row content for bundle routing: collection progress, pitch, pair
 * detection, and the key map. Idle shows the entry prompt. `notice` renders
 * in BOTH states (commit blocks, rejected pad clicks) so feedback for the
 * first click is never swallowed.
 */
export function BundleHud({
  model,
  notice = null,
}: {
  model: BundleHudModel | null;
  notice?: string | null;
}): ReactElement {
  if (!model) {
    return (
      <>
        <PcbParamRow>
          <span className="shrink-0 font-sans font-medium text-text-strong">
            Bundle
          </span>
          <span
            role="status"
            aria-label="Bundle tool"
            className="truncate font-sans text-text-tertiary"
          >
            Bundle — click 2+ pads to collect, then click space to route them in
            parallel · Esc exit
          </span>
        </PcbParamRow>
        {notice ? (
          <PcbParamRow className="text-status-danger">
            <span role="alert">{notice}</span>
          </PcbParamRow>
        ) : null}
      </>
    );
  }
  return (
    <>
      <PcbParamRow>
        <span className="shrink-0 font-sans font-medium text-text-strong">
          Bundle
        </span>
        <span
          role="region"
          aria-label="Bundle status"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <span className="font-medium text-text-strong">
            {model.padCount} pad{model.padCount === 1 ? "" : "s"}
            {model.diffPair ? " · diff pair" : ""}
          </span>
          {model.netNames.length > 0 ? (
            <span className="max-w-64 truncate text-text-tertiary">
              {model.netNames.join(", ")}
            </span>
          ) : null}
          <span className="text-text-tertiary">
            pitch {model.pitchMm.toFixed(2)} mm
          </span>
          {!model.routing && model.padCount < 2 ? (
            <span className="text-text-disabled">click more pads…</span>
          ) : null}
        </span>
      </PcbParamRow>
      {notice ? (
        <PcbParamRow className="text-status-danger">
          <span role="alert">{notice}</span>
        </PcbParamRow>
      ) : null}
      <PcbParamRow className="text-text-disabled">
        {model.routing ? (
          <span>
            <kbd className="font-sans">click</kbd> waypoint
          </span>
        ) : (
          <span>
            <kbd className="font-sans">click pad</kbd> add/remove
          </span>
        )}
        <span>
          <kbd className="font-sans">,/.</kbd> pitch
        </span>
        <span>
          <kbd className="font-sans">⌫</kbd> back
        </span>
        <span>
          <kbd className="font-sans">Enter</kbd> commit lanes
        </span>
        <span>
          <kbd className="font-sans">Esc</kbd> cancel
        </span>
      </PcbParamRow>
    </>
  );
}
