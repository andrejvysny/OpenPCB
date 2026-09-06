import { useMemo, useState, type ReactElement } from "react";
import { Checkbox, PanelSectionHeader, SearchField } from "@shared/frontend/ui";
import type {
  LibraryFacetBucket,
  LibraryFacetOption,
  LibraryFacets,
} from "../../../../sdks/library";

const SOURCE_TAG_PREFIX = "source:";
/** Show this many options per section before "show more" reveals the rest. */
const COLLAPSE_THRESHOLD = 6;
/** Sections beyond this size also get a search-within-facet input. */
const SEARCH_WITHIN_THRESHOLD = 10;

interface SectionConfig {
  bucket: Exclude<LibraryFacetBucket, never>;
  label: string;
  prefix: string; // tag prefix to emit (empty for plain tags)
}

const SECTIONS: SectionConfig[] = [
  { bucket: "source", label: "Source", prefix: SOURCE_TAG_PREFIX },
  { bucket: "family", label: "Family", prefix: "" },
  { bucket: "mount", label: "Mount", prefix: "" },
  { bucket: "package", label: "Package", prefix: "" },
  { bucket: "other", label: "Other", prefix: "" },
];

export interface FacetSidebarProps {
  facets: LibraryFacets;
  activeFilters: ReadonlySet<string>;
  onToggle: (filterToken: string) => void;
}

/**
 * Facet rail. It carries no header row of its own: the `aside` label plus the
 * per-bucket section headers already name it, and "Clear all" lives in the
 * results chip row next to the chips it clears.
 */
/** Mount facet keys are raw tags (`smd`, `through_hole`); show the display form. */
const MOUNT_LABELS: Record<string, string> = {
  smd: "SMD",
  smt: "SMD",
  tht: "THT",
  through_hole: "THT",
  mixed: "Mixed",
  unknown: "Unknown",
};

function facetOptionLabel(sectionKey: string, option: { key: string; label: string }): string {
  if (sectionKey !== "mount") return option.label;
  return MOUNT_LABELS[option.key.toLowerCase()] ?? option.label;
}

export function FacetSidebar({
  facets,
  activeFilters,
  onToggle,
}: FacetSidebarProps): ReactElement {
  return (
    <aside
      aria-label="Filter facets"
      className="flex h-full w-[220px] shrink-0 flex-col overflow-y-auto border-r border-border bg-surface-panel"
    >
      <div className="flex-1">
        {SECTIONS.map((section) => {
          const options = facets[section.bucket];
          if (options.length === 0) return null;
          return (
            <FacetSection
              key={section.bucket}
              config={section}
              options={options}
              activeFilters={activeFilters}
              onToggle={onToggle}
            />
          );
        })}
      </div>
    </aside>
  );
}

interface FacetSectionProps {
  config: SectionConfig;
  options: readonly LibraryFacetOption[];
  activeFilters: ReadonlySet<string>;
  onToggle: (filterToken: string) => void;
}

function FacetSection({
  config,
  options,
  activeFilters,
  onToggle,
}: FacetSectionProps): ReactElement {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.key.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
    );
  }, [options, query]);

  // Always surface active selections even if they'd be hidden behind "show more".
  const visible = useMemo(() => {
    if (showAll) return filtered;
    if (filtered.length <= COLLAPSE_THRESHOLD) return filtered;
    const head = filtered.slice(0, COLLAPSE_THRESHOLD);
    const overflow = filtered.slice(COLLAPSE_THRESHOLD);
    const promoted = overflow.filter((o) =>
      activeFilters.has(`${config.prefix}${o.key}`),
    );
    return [...head, ...promoted];
  }, [filtered, showAll, activeFilters, config.prefix]);

  const hiddenCount = filtered.length - visible.length;
  const showsSearch = options.length > SEARCH_WITHIN_THRESHOLD;

  return (
    <section>
      <PanelSectionHeader
        title={config.label}
        count={options.length}
        collapsed={!expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      {expanded && (
        <div className="py-0.5">
          {showsSearch && (
            <div className="px-2 pb-1 pt-0.5">
              <SearchField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Filter ${config.label.toLowerCase()}…`}
                aria-label={`Filter ${config.label.toLowerCase()} options`}
              />
            </div>
          )}
          {visible.map((option) => {
            const token = `${config.prefix}${option.key}`;
            const checked = activeFilters.has(token);
            const label = facetOptionLabel(config.bucket, option);
            return (
              <div
                key={option.key}
                className="flex h-[22px] items-center gap-2 pl-3 pr-2"
              >
                <Checkbox
                  checked={checked}
                  onChange={() => onToggle(token)}
                  aria-label={`${config.label}: ${label}`}
                  wrapperClassName="min-w-0 flex-1"
                  className={
                    checked
                      ? "text-text-strong"
                      : "text-text hover:text-text-strong"
                  }
                  label={
                    <span className="truncate" title={label}>
                      {label}
                    </span>
                  }
                />
                <span
                  className={`shrink-0 font-mono text-2xs tabular-nums ${
                    option.count === 0
                      ? "text-text-disabled opacity-60"
                      : "text-text-disabled"
                  }`}
                >
                  {option.count}
                </span>
              </div>
            );
          })}
          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex h-[22px] w-full items-center pl-3 pr-2 text-left text-2xs text-text-secondary outline-none hover:text-text-strong"
            >
              Show {hiddenCount} more…
            </button>
          )}
        </div>
      )}
    </section>
  );
}
