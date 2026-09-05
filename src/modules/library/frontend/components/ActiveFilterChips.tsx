import type { ReactElement } from "react";
import { X } from "lucide-react";
import type { LibraryFacets } from "../../../../sdks/library";

const SOURCE_TAG_PREFIX = "source:";

export interface ActiveFilterChipsProps {
  activeFilters: ReadonlySet<string>;
  facets: LibraryFacets;
  onRemove: (token: string) => void;
  onClearAll: () => void;
}

/**
 * Strip above the results grid that mirrors the sidebar's active selections
 * as removable chips, plus a single "Clear all". Filter tokens are matched
 * back to their facet bucket so we can show a human label like
 * `Source: openpcb.core` instead of the raw token.
 */
export function ActiveFilterChips({
  activeFilters,
  facets,
  onRemove,
  onClearAll,
}: ActiveFilterChipsProps): ReactElement | null {
  if (activeFilters.size === 0) return null;
  const chips: Array<{ token: string; bucket: string; label: string }> = [];
  for (const token of activeFilters) {
    if (token.startsWith(SOURCE_TAG_PREFIX)) {
      const key = token.slice(SOURCE_TAG_PREFIX.length);
      const entry = facets.source.find((o) => o.key === key);
      chips.push({
        token,
        bucket: "Source",
        label: entry?.label ?? key,
      });
      continue;
    }
    // Find which bucket this token belongs to so the chip can carry a prefix.
    const buckets: Array<[string, readonly { key: string; label: string }[]]> =
      [
        ["Family", facets.family],
        ["Mount", facets.mount],
        ["Package", facets.package],
        ["Other", facets.other],
      ];
    let matched = false;
    for (const [bucketLabel, options] of buckets) {
      const hit = options.find((o) => o.key === token);
      if (hit) {
        chips.push({ token, bucket: bucketLabel, label: hit.label });
        matched = true;
        break;
      }
    }
    if (!matched) {
      chips.push({ token, bucket: "Tag", label: token });
    }
  }

  return (
    <div className="flex min-w-0 shrink items-center gap-1.5 overflow-hidden">
      {chips.map((chip) => (
        <button
          key={chip.token}
          type="button"
          onClick={() => onRemove(chip.token)}
          aria-label={`Remove filter ${chip.bucket}: ${chip.label}`}
          className="group inline-flex h-[18px] shrink-0 items-center gap-1 rounded-control border border-border-control px-1.5 text-2xs text-text outline-none transition-colors hover:bg-surface-hover hover:text-text-strong"
        >
          <span className="text-text-tertiary">{chip.bucket}:</span>
          <span className="max-w-[10rem] truncate">{chip.label}</span>
          <X
            aria-hidden="true"
            className="h-2.5 w-2.5 text-text-tertiary group-hover:text-text-strong"
          />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="shrink-0 text-2xs text-text-secondary underline-offset-2 outline-none hover:text-text-strong hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
