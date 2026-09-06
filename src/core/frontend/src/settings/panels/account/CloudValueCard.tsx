import {
  Cloud,
  History,
  LayoutDashboard,
  RefreshCw,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

const BENEFITS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: RefreshCw, label: "Sync projects across devices" },
  { icon: UploadCloud, label: "Automatic cloud backup" },
  { icon: History, label: "Full revision history & restore" },
  { icon: LayoutDashboard, label: "Web project dashboard" },
];

export function CloudValueCard() {
  return (
    <section className="rounded-control border border-border bg-surface-panel px-4 py-[14px]">
      <div className="flex items-center gap-2">
        <Cloud
          className="h-[18px] w-[18px] text-selection"
          strokeWidth={1.8}
        />
        <h3 className="text-sm font-medium text-text-strong">
          OpenPCB Cloud
        </h3>
        <span className="ml-auto rounded-full bg-selection-soft px-2 py-0.5 text-xs font-medium text-selection">
          Paid
        </span>
      </div>

      <p className="mt-3 text-sm text-text-secondary">
        What an account unlocks:
      </p>

      <ul className="mt-2 space-y-2">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2.5 text-sm text-text"
          >
            <Icon
              className="h-4 w-4 shrink-0 text-text-tertiary"
              strokeWidth={1.8}
            />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
