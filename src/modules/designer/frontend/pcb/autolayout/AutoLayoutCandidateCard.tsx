import { useState, type ReactElement } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Star } from "lucide-react";

import type { LayoutCandidate } from "../../../../../sdks/designer/cloud-autolayout";

/**
 * Service tag → label. Unknown tags are shown verbatim: the service can add tags without a
 * desktop release, and dropping one would silently hide the reason a candidate is
 * interesting.
 */
const TAG_LABELS: Record<string, string> = {
  most_complete: "Most complete",
  shortest_copper: "Shortest copper",
  fewest_vias: "Fewest vias",
  closest_to_your_layout: "Closest to current layout",
};

function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag.replace(/_/g, " ");
}

/**
 * `input_preserved` means the engine could not beat the user's own placement, so the
 * candidate keeps it and only adds routing. Saying "Candidate 3" there would take credit
 * for work it did not do.
 */
function candidateTitle(candidate: LayoutCandidate, index: number): string {
  return candidate.kind.startsWith("input_preserved")
    ? "Keep current placement"
    : `Candidate ${index + 1}`;
}

function formatMm(nm: number | null | undefined): string | null {
  return nm == null ? null : `${(nm / 1_000_000).toFixed(0)} mm copper`;
}

function completionLabel(candidate: LayoutCandidate): string | null {
  const ratio = candidate.scorecard?.completionRatio;
  return ratio == null ? null : `${Math.round(ratio * 100)}% routed`;
}

export function AutoLayoutCandidateCard({
  candidate,
  index,
  selected,
  disabled,
  onSelect,
}: {
  candidate: LayoutCandidate;
  index: number;
  selected: boolean;
  /** Apply is unavailable (stale result / applying) — selection still previews. */
  disabled: boolean;
  onSelect: () => void;
}): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const failed = Boolean(candidate.failure);
  const scorecard = candidate.scorecard ?? {};
  const chips = [
    completionLabel(candidate),
    scorecard.viaCount == null ? null : `${scorecard.viaCount} vias`,
    formatMm(scorecard.routedLengthNm),
  ].filter((chip): chip is string => chip !== null);

  return (
    <li
      className={[
        "rounded-control border px-3 py-2 transition-colors",
        failed
          ? "border-border bg-surface-panel opacity-70"
          : selected
            ? "border-selection bg-selection-soft"
            : "border-border hover:border-border-control",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        // A failed candidate stays visible and inspectable but can never become the apply
        // target — it is part of the result, not an option.
        disabled={failed}
        className="flex w-full items-start justify-between gap-3 text-left disabled:cursor-default"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            {candidate.recommended ? (
              <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />
            ) : null}
            <span className="text-xs font-semibold text-text-strong">
              {candidateTitle(candidate, index)}
            </span>
            {candidate.recommended ? (
              <span className="rounded-control bg-status-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-status-warning">
                Recommended
              </span>
            ) : null}
            {failed ? (
              <span className="rounded-control bg-status-danger-soft px-1.5 py-0.5 text-[10px] font-medium text-status-danger">
                Failed
              </span>
            ) : null}
          </span>

          {chips.length > 0 ? (
            <span className="mt-1 block text-[11px] text-text-secondary">
              {chips.join(" · ")}
            </span>
          ) : null}

          {candidate.tags && candidate.tags.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {candidate.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-control bg-surface-control px-1.5 py-0.5 text-[10px] text-text-secondary"
                >
                  {tagLabel(tag)}
                </span>
              ))}
            </span>
          ) : null}

          {/* Rendered verbatim: the service generates this from the first differing
              objective field, and paraphrasing it would change what it claims. */}
          {candidate.explanation ? (
            <span className="mt-1 block text-[11px] text-text-tertiary">
              {candidate.explanation}
            </span>
          ) : null}
        </span>

        {selected && !failed ? (
          <span className="shrink-0 rounded-control bg-selection px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            {disabled ? "Previewing" : "Selected"}
          </span>
        ) : null}
      </button>

      {failed || (candidate.warnings && candidate.warnings.length > 0) ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-strong"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Diagnostics
        </button>
      ) : null}

      {expanded ? (
        <div className="mt-1 space-y-1 rounded-control bg-surface-panel px-2 py-1.5 text-[11px] text-text-secondary">
          {candidate.failure ? (
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-status-danger" />
              <span>
                <strong>{candidate.failure.code}</strong> at stage{" "}
                {candidate.failure.stage}
                {candidate.failure.detail ? ` — ${candidate.failure.detail}` : ""}
              </span>
            </p>
          ) : null}
          {(candidate.warnings ?? []).map((warning, i) => (
            <p key={i}>{warning}</p>
          ))}
        </div>
      ) : null}
    </li>
  );
}
