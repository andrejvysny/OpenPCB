import { useState, type ReactElement, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OutlineGroupProps {
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function OutlineGroup({
  label,
  count,
  defaultOpen = true,
  children,
}: OutlineGroupProps): ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[22px] items-center gap-1.5 bg-surface-section px-2 text-left text-2xs uppercase tracking-[.04em] text-text-tertiary transition-colors hover:text-text"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <span>{label}</span>
        <span className="ml-1 font-mono text-2xs tabular-nums text-text-tertiary">
          {count}
        </span>
      </button>
      {open && count > 0 && <div className="flex flex-col">{children}</div>}
      {open && count === 0 && (
        <div className="px-2 pb-2 pt-0.5 text-2xs italic text-text-disabled">
          none
        </div>
      )}
    </div>
  );
}
