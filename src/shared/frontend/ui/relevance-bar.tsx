import { cn } from "@/lib/utils";

/** Color tier for a 0–100 relevance percentage (audit tiers). */
export function relevanceTier(pct: number): "high" | "mid" | "low" | "poor" {
  if (pct >= 90) return "high";
  if (pct >= 60) return "mid";
  if (pct >= 30) return "low";
  return "poor";
}

const TIER_BAR: Record<ReturnType<typeof relevanceTier>, string> = {
  high: "bg-status-success",
  mid: "bg-status-info",
  low: "bg-status-warning",
  poor: "bg-status-neutral",
};

export function RelevanceBar({
  pct,
  className,
}: {
  /** 0–100. */
  pct: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const tier = relevanceTier(clamped);
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="h-1 w-12 overflow-hidden rounded-none bg-surface-control">
        <div
          className={cn("h-full", TIER_BAR[tier])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="font-mono text-2xs tabular-nums text-text-tertiary">
        {clamped}%
      </span>
    </div>
  );
}
