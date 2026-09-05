import {
  useCallback,
  useMemo,
  useRef,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import {
  Box,
  Cpu,
  Lightbulb,
  Minus,
  Plug,
  Power,
  Thermometer,
  Triangle,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Checkbox, TableHeaderRow, TableRow } from "@shared/frontend/ui";
import type { LibraryComponent } from "../../../../sdks/library";
import {
  componentSourceKey,
  summarizeComponentTags,
} from "../detail-helpers";
import { setComponentDragData } from "../lib/component-drag";

/**
 * `24px 1.4fr 90px 1.1fr 60px 110px` — design D3 §2 minus the `44px` Pins
 * column: the list DTO carries no pin/pad count (it only exists on the detail
 * payload), so the column is omitted rather than faked.
 */
const COLS = "24px 1.4fr 90px 1.1fr 60px 110px";
const COLS_WITH_SELECTION = `24px ${COLS}`;

/** Family tag → 14px outline glyph. Falls back to a generic part box. */
const FAMILY_ICONS: Record<string, LucideIcon> = {
  resistor: Minus,
  capacitor: Minus,
  inductor: Waves,
  crystal: Waves,
  oscillator: Waves,
  diode: Triangle,
  led: Lightbulb,
  opamp: Triangle,
  mosfet: Zap,
  transistor: Zap,
  ic: Cpu,
  mcu: Cpu,
  digital: Cpu,
  analog: Zap,
  connector: Plug,
  header: Plug,
  sensor: Thermometer,
  power: Power,
};

function glyphFor(family: string | null): LucideIcon {
  if (!family) return Box;
  return FAMILY_ICONS[family] ?? Box;
}

export interface LibraryTableProps {
  components: readonly LibraryComponent[];
  /** Ids checked for bulk actions (drives the leading checkbox column). */
  selectedIds: ReadonlySet<string>;
  /** True once at least one row is checked; reveals the checkbox column. */
  selectionMode: boolean;
  /** The row whose detail feeds the preview pane. */
  selectedComponentId: string | null;
  sortKey: "name" | "recent";
  onSortByName: () => void;
  onSelectRow: (componentId: string) => void;
  onOpen: (componentId: string) => void;
  onToggleSelect: (componentId: string) => void;
}

/** Dense component table (design D3 §2). Rows drag with the same payload as `LibraryCard`. */
export function LibraryTable({
  components,
  selectedIds,
  selectionMode,
  selectedComponentId,
  sortKey,
  onSortByName,
  onSelectRow,
  onOpen,
  onToggleSelect,
}: LibraryTableProps): ReactElement {
  const cols = selectionMode ? COLS_WITH_SELECTION : COLS;
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const rows = useMemo(
    () =>
      components.map((component) => ({
        component,
        tags: summarizeComponentTags(component.tags),
        source: componentSourceKey(component),
      })),
    [components],
  );

  const moveSelection = useCallback(
    (index: number, delta: number) => {
      if (rows.length === 0) return;
      const next = Math.min(Math.max(index + delta, 0), rows.length - 1);
      const target = rows[next];
      if (!target) return;
      onSelectRow(target.component.id);
      rowRefs.current[next]?.focus();
    },
    [onSelectRow, rows],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, index: number, id: string) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          moveSelection(index, 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          moveSelection(index, -1);
          break;
        case "Enter":
          event.preventDefault();
          onOpen(id);
          break;
        default:
          break;
      }
    },
    [moveSelection, onOpen],
  );

  const focusIndex = Math.max(
    rows.findIndex((row) => row.component.id === selectedComponentId),
    0,
  );

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <TableHeaderRow cols={cols}>
        {selectionMode ? <span /> : null}
        <span />
        <button
          type="button"
          onClick={onSortByName}
          aria-label="Sort by name"
          className="flex min-w-0 items-center gap-1 text-left uppercase tracking-[.04em] outline-none hover:text-text-secondary"
        >
          Name
          {sortKey === "name" ? (
            <span aria-hidden="true" className="text-text-secondary">
              ▴
            </span>
          ) : null}
        </button>
        <span>Family</span>
        <span>Package</span>
        <span>Mount</span>
        <span>Source</span>
      </TableHeaderRow>

      {rows.map(({ component, tags, source }, index) => {
        const Glyph = glyphFor(tags.family);
        const isSelected = component.id === selectedComponentId;
        return (
          <TableRow
            key={component.id}
            ref={(node) => {
              rowRefs.current[index] = node;
            }}
            cols={cols}
            selected={isSelected}
            draggable
            tabIndex={index === focusIndex ? 0 : -1}
            data-testid={`library-component-row-${component.id}`}
            onDragStart={(event: DragEvent<HTMLDivElement>) =>
              setComponentDragData(event, component)
            }
            onClick={() => onSelectRow(component.id)}
            onDoubleClick={() => onOpen(component.id)}
            onKeyDown={(event) => handleKeyDown(event, index, component.id)}
            className="cursor-pointer outline-none focus-visible:bg-surface-hover"
          >
            {selectionMode ? (
              <span
                className="flex items-center"
                onClick={(event) => event.stopPropagation()}
              >
                {component.isBuiltin ? null : (
                  <Checkbox
                    checked={selectedIds.has(component.id)}
                    onChange={() => onToggleSelect(component.id)}
                    aria-label={`Select ${component.name}`}
                  />
                )}
              </span>
            ) : null}

            <Glyph
              aria-hidden="true"
              strokeWidth={1.5}
              className="h-[14px] w-[14px] text-text-tertiary"
            />

            <span className="min-w-0 truncate" title={component.name}>
              <span className="text-text-strong">{component.name}</span>
              {component.description ? (
                <span className="text-text-tertiary">
                  {" · "}
                  {component.description}
                </span>
              ) : null}
            </span>

            <span className="truncate text-text-secondary">
              {tags.family ?? "—"}
            </span>
            <span className="truncate font-mono text-2xs text-text-secondary">
              {tags.package ?? "—"}
            </span>
            <span className="truncate text-text-secondary">
              {tags.mount ?? "—"}
            </span>
            <span className="truncate text-[9.5px] uppercase tracking-[.06em] text-text-tertiary">
              {source}
            </span>
          </TableRow>
        );
      })}
    </div>
  );
}
