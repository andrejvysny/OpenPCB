import { useMemo, type ReactElement, type ReactNode } from "react";
import { ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import {
  FootprintPreviewCanvas,
  SymbolPreviewCanvas,
} from "../../../../shared/frontend/canvas/preview";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  PanelSectionHeader,
  PropertyGrid,
  PropertyRow,
} from "@shared/frontend/ui";
import {
  asFootprintRender,
  asSymbolRender,
  componentSourceKey,
  getDefaultVariant,
  packageLabel,
  stripReferenceLabels,
  summarizeComponentTags,
} from "../detail-helpers";
import { useComponentDetail } from "../hooks/useComponentDetail";

export interface LibraryPreviewPaneProps {
  backendURL: string | null | undefined;
  moduleId: string;
  /** The row currently selected in the table; `null` renders the empty state. */
  componentId: string | null;
  /** Opens the full detail page (where editing, cloning and STEP upload live). */
  onOpen: (componentId: string) => void;
  /** Deletes the component; the overflow menu hides it for built-ins. */
  onDelete: (componentId: string) => void;
  refreshToken?: number;
}

/** Sticky 380px preview rail for the selected library row (design D3 §2). */
export function LibraryPreviewPane({
  backendURL,
  moduleId,
  componentId,
  onOpen,
  onDelete,
  refreshToken = 0,
}: LibraryPreviewPaneProps): ReactElement {
  const { detail, loading, error } = useComponentDetail({
    backendURL,
    moduleId,
    componentId,
    refreshToken,
  });

  const symbolPreview = useMemo(
    () => asSymbolRender(detail?.symbol.preview),
    [detail?.symbol.preview],
  );
  const footprintPreview = useMemo(() => {
    const model = asFootprintRender(detail?.footprint.preview);
    return model ? stripReferenceLabels(model) : null;
  }, [detail?.footprint.preview]);

  const component = detail?.component ?? null;
  const tagSummary = useMemo(
    () => summarizeComponentTags(component?.tags ?? []),
    [component?.tags],
  );
  const variants = useMemo(
    () => detail?.footprintVariants ?? [],
    [detail?.footprintVariants],
  );
  const defaultVariant = detail ? getDefaultVariant(detail) : null;
  const pins = symbolPreview?.pins ?? [];

  return (
    <aside
      aria-label="Component preview"
      className="flex h-full w-[380px] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface-panel"
    >
      {!componentId ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-text-tertiary">
          Select a part to preview
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-10 flex h-[34px] shrink-0 items-center gap-2 border-b border-border bg-surface-panel px-2">
            <span className="min-w-0 truncate text-base font-medium text-text-strong">
              {component?.name ?? (loading ? "Loading…" : "Component")}
            </span>
            {component ? (
              <span className="shrink-0 border border-border-control px-[5px] text-[9.5px] uppercase tracking-[.06em] text-text-secondary">
                {componentSourceKey(component)}
              </span>
            ) : null}

            <div className="flex-1" />

            <Button
              type="button"
              onClick={() => onOpen(componentId)}
              className="bg-surface-control font-medium text-text-strong"
            >
              Open
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton label="Component actions">
                  <MoreHorizontal aria-hidden="true" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => onOpen(componentId)}>
                  <ExternalLink aria-hidden="true" />
                  Open
                </DropdownMenuItem>
                {component && !component.isBuiltin ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      destructive
                      onSelect={() => onDelete(component.id)}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <div className="grid shrink-0 grid-cols-2 gap-px border-b border-border bg-border">
            <PreviewCell label="Symbol" wellClassName="bg-surface-schematic-well">
              <SymbolPreviewCanvas
                model={symbolPreview}
                emptyMessage="No symbol preview"
              />
            </PreviewCell>
            <PreviewCell label="Footprint" wellClassName="bg-surface-canvas-well">
              <FootprintPreviewCanvas
                model={footprintPreview}
                emptyMessage="No footprint preview"
              />
            </PreviewCell>
          </div>

          {loading ? (
            <p className="px-2 py-2 text-xs text-text-tertiary">
              Loading component detail…
            </p>
          ) : null}
          {error ? (
            <p className="px-2 py-2 text-xs text-status-danger">{error}</p>
          ) : null}

          {detail && component ? (
            <>
              <PanelSectionHeader variant="uppercase" title="Part" />
              <PropertyGrid>
                <PropertyRow label="Name" mono>
                  {component.name}
                </PropertyRow>
                {component.description ? (
                  <PropertyRow label="Description" title={component.description}>
                    {component.description}
                  </PropertyRow>
                ) : null}
                {tagSummary.family ? (
                  <PropertyRow label="Family">{tagSummary.family}</PropertyRow>
                ) : null}
                {component.manufacturerPartNumber ? (
                  <PropertyRow label="MPN" mono>
                    {component.manufacturerPartNumber}
                  </PropertyRow>
                ) : null}
                {component.manufacturer ? (
                  <PropertyRow label="Manufacturer">
                    {component.manufacturer}
                  </PropertyRow>
                ) : null}
                {component.datasheetUrl ? (
                  <PropertyRow label="Datasheet" mono>
                    <a
                      href={component.datasheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-text-secondary underline underline-offset-2 hover:text-text-strong"
                    >
                      {component.datasheetUrl}
                    </a>
                  </PropertyRow>
                ) : null}
              </PropertyGrid>

              <PanelSectionHeader
                variant="uppercase"
                title="Footprints"
                count={variants.length}
              />
              <div>
                {variants.map((variant) => (
                  <div
                    key={variant.footprintId}
                    className="flex h-[22px] items-center gap-2 border-b border-border-subtle px-2 text-xs"
                  >
                    <span
                      className="min-w-0 flex-1 truncate font-mono text-text-strong"
                      title={variant.name}
                    >
                      {variant.name}
                    </span>
                    <span className="shrink-0 text-text-tertiary">
                      {variant.mountType ?? "—"}
                    </span>
                    {variant.isDefault ? (
                      <span className="shrink-0 bg-surface-control px-1.5 text-2xs uppercase tracking-[.06em] text-text-strong">
                        default
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <PanelSectionHeader
                variant="uppercase"
                title="Pins"
                count={detail.symbol.pinCount}
              />
              {pins.length > 0 ? (
                <div>
                  <div className="grid h-[20px] grid-cols-[28px_1fr_80px] items-center gap-2 border-b border-border px-2 text-2xs uppercase tracking-[.04em] text-text-caps">
                    <span>#</span>
                    <span>Name</span>
                    <span className="text-right">Type</span>
                  </div>
                  {pins.map((pin) => (
                    <div
                      key={pin.id}
                      className="grid h-[20px] grid-cols-[28px_1fr_80px] items-center gap-2 border-b border-border-subtle px-2 text-2xs"
                    >
                      <span className="truncate font-mono text-text-tertiary">
                        {pin.number ?? "—"}
                      </span>
                      <span className="truncate font-mono text-text-strong">
                        {pin.name || "—"}
                      </span>
                      <span className="truncate text-right text-text-tertiary">
                        {pin.electricalType}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-2 text-xs text-text-tertiary">
                  No pin data for this symbol.
                </p>
              )}

              <SpecsSection
                rows={[
                  {
                    label: "Package",
                    value: defaultVariant ? packageLabel(defaultVariant) : null,
                    mono: true,
                  },
                  {
                    label: "Mount",
                    value: detail.footprint.mountType,
                  },
                  {
                    label: "Pads",
                    value: detail.footprint.padCount
                      ? String(detail.footprint.padCount)
                      : null,
                    mono: true,
                  },
                  {
                    label: "Ref prefix",
                    value: detail.symbol.referencePrefix,
                    mono: true,
                  },
                  { label: "Supplier", value: component.supplier ?? null },
                  {
                    label: "LCSC",
                    value: component.lcscPartNumber ?? null,
                    mono: true,
                  },
                  {
                    label: "Subcategory",
                    value: component.subcategory ?? null,
                  },
                ]}
              />
            </>
          ) : null}
        </>
      )}
    </aside>
  );
}

function PreviewCell({
  label,
  wellClassName,
  children,
}: {
  label: string;
  /** Well background token: schematic ground for symbols, canvas for footprints. */
  wellClassName: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className={`relative h-[150px] ${wellClassName}`}>
      {children}
      <span className="pointer-events-none absolute left-1.5 top-1 text-2xs uppercase tracking-[.04em] text-text-disabled">
        {label}
      </span>
    </div>
  );
}

interface SpecRow {
  label: string;
  value: string | null;
  mono?: boolean;
}

function SpecsSection({ rows }: { rows: SpecRow[] }): ReactElement | null {
  const present = rows.filter((row) => row.value && row.value.length > 0);
  if (present.length === 0) return null;
  return (
    <>
      <PanelSectionHeader variant="uppercase" title="Specs" />
      <PropertyGrid>
        {present.map((row) => (
          <PropertyRow key={row.label} label={row.label} mono={row.mono}>
            {row.value}
          </PropertyRow>
        ))}
      </PropertyGrid>
    </>
  );
}
