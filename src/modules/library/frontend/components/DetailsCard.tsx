import { ExternalLink } from "lucide-react";
import type { ReactElement } from "react";
import { PanelSectionHeader, PropertyGrid, PropertyRow } from "@shared/frontend/ui";

interface DetailsCardProps {
  componentName: string;
  defaultFootprintName: string;
  optionCount: number;
  source: string;
  datasheetUrl?: string | null;
}

/** Read-only "Details" card: component identity + footprint/source summary. */
export function DetailsCard({
  componentName,
  defaultFootprintName,
  optionCount,
  source,
  datasheetUrl,
}: DetailsCardProps): ReactElement {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-control border border-border bg-surface-panel">
      <PanelSectionHeader variant="uppercase" title="Details" />
      <div className="flex flex-1 flex-col">
        <PropertyGrid>
          <PropertyRow label="Component name" mono>
            {componentName}
          </PropertyRow>
          <PropertyRow label="Default footprint" mono>
            {defaultFootprintName}
          </PropertyRow>
          <PropertyRow label="Footprint options" mono>
            {String(optionCount)}
          </PropertyRow>
          <PropertyRow label="Source">{source}</PropertyRow>
          {datasheetUrl ? (
            <PropertyRow label="Datasheet">
              <a
                href={datasheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-text-secondary underline underline-offset-2 hover:text-text-strong"
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </a>
            </PropertyRow>
          ) : null}
        </PropertyGrid>
        {/* Absorb extra row height as empty space, keeping the rows compact. */}
        <div className="flex-1" aria-hidden="true" />
      </div>
    </section>
  );
}
