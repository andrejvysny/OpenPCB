import type { ReactElement } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import type { PlacePayloadSummary } from "../../../../sdks";

interface PcbPlacePreviewBarProps {
  /** Engine metrics for the summary line (from the result envelope). */
  payload: PlacePayloadSummary | null;
  /** Components whose pose currently differs from the original (includes user adjustments). */
  changedCount: number;
  applying: boolean;
  /** Post-apply note (success/DRC/failure summary) shown briefly before the bar closes. */
  appliedNote: string | null;
  appliedHasIssues: boolean;
  onAccept: () => void;
  onReject: () => void;
}

/**
 * Floating canvas bar for the interactive auto-place preview. Shows the proposal's metrics
 * and the live changed-count, and lets the user Accept (commit the adjusted layout as a
 * batch) or Reject (discard, Esc also works). Replaces the old per-op cherry-pick dialog.
 */
export function PcbPlacePreviewBar({
  payload,
  changedCount,
  applying,
  appliedNote,
  appliedHasIssues,
  onAccept,
  onReject,
}: PcbPlacePreviewBarProps): ReactElement {
  const metrics = payload?.metrics;
  const unplaced = payload?.unplaced.length ?? 0;

  return (
    <div
      role="region"
      aria-label="Auto-place preview"
      className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 flex-col gap-2 rounded-float border border-border bg-surface-panel px-3 py-2 shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-strong">
            Auto-place preview
          </span>
          <span className="text-2xs text-text-tertiary">
            {changedCount} component{changedCount === 1 ? "" : "s"} changed —
            drag, R to rotate, F to flip
          </span>
        </div>

        {metrics ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-l border-border pl-3 text-2xs text-text-secondary">
            <span>
              Placed{" "}
              <strong>
                {payload?.placedCount}/{payload?.totalComponents}
              </strong>
            </span>
            <span>
              Ratsnest{" "}
              <strong>
                {metrics.ratsnestLengthBeforeMm.toFixed(1)}→
                {metrics.ratsnestLengthAfterMm.toFixed(1)} mm
              </strong>{" "}
              ({metrics.ratsnestImprovementPct.toFixed(0)}%)
            </span>
            <span>
              Overlaps <strong>{metrics.overlapPairsAfter}</strong>
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 border-l border-border pl-3">
          <button
            type="button"
            onClick={onReject}
            disabled={applying}
            className="inline-flex h-[22px] items-center gap-1.5 rounded-control border border-border-control px-2 text-xs text-text transition-colors hover:bg-surface-hover hover:text-text-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={applying || changedCount === 0}
            data-testid="pcb-autoplace-accept"
            className="inline-flex h-[22px] items-center gap-1.5 rounded-control bg-primary px-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {applying ? "Applying…" : "Accept"}
          </button>
        </div>
      </div>

      {unplaced > 0 ? (
        <p className="flex items-center gap-1.5 text-2xs text-status-warning">
          <AlertTriangle className="h-3 w-3" />
          {unplaced} component(s) could not be legally placed and were left in
          place.
        </p>
      ) : null}

      {appliedNote ? (
        <p
          className={
            appliedHasIssues
              ? "text-2xs text-status-warning"
              : "text-2xs text-status-success"
          }
        >
          {appliedNote}
        </p>
      ) : null}
    </div>
  );
}
