import {
  CircuitBoard,
  Sparkles,
  Wand2,
  Workflow,
  type LucideIcon,
} from "lucide-react";

const CHIPS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Wand2, label: "Zero-setup tuned models" },
  { icon: Workflow, label: "Direct JLCPCB BOM sourcing" },
  { icon: CircuitBoard, label: "EDA-trained ERC/DRC suggestions" },
];

export function AiCloudTeaser() {
  return (
    <section className="rounded-control border border-border bg-surface-panel px-4 py-[14px]">
      <div className="flex items-center gap-2">
        <Sparkles
          className="h-[18px] w-[18px] text-selection"
          strokeWidth={1.8}
        />
        <h3 className="text-sm font-medium text-text-strong">
          OpenPCB AI Cloud
        </h3>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          Coming soon
        </span>
      </div>

      <p className="mt-2 text-sm text-text-secondary">
        A managed, optimized assistant. Today OpenPCB is free with your own
        provider key (BYOK). Cloud will add it on a subscription:
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-panel px-2.5 py-1 text-xs text-text-secondary"
          >
            <Icon
              className="h-3.5 w-3.5 text-text-tertiary"
              strokeWidth={1.8}
            />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
