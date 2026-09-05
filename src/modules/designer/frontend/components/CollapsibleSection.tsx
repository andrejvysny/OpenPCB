import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { PanelSectionHeader } from "@shared/frontend/ui/panel-section-header";

interface CollapsibleSectionProps {
  /** Stable id used as the localStorage key (e.g. "pcb.sidebar.board"). */
  id: string;
  title: string;
  defaultOpen?: boolean;
  /** Optional element rendered on the right side of the header row. */
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}

function readStored(id: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(id);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Collapsible section with a 24px panel header. Content stays mounted while
 * collapsed (via `hidden`) so React portal targets remain valid.
 */
export function CollapsibleSection({
  id,
  title,
  defaultOpen = true,
  trailing,
  children,
  className,
}: CollapsibleSectionProps): ReactElement {
  const [open, setOpen] = useState<boolean>(() => readStored(id, defaultOpen));

  useEffect(() => {
    try {
      window.localStorage.setItem(id, open ? "1" : "0");
    } catch {
      // ignore quota / privacy errors
    }
  }, [id, open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <section className={`flex min-h-0 flex-col ${className ?? ""}`}>
      <PanelSectionHeader
        title={title}
        collapsed={!open}
        onToggle={toggle}
        trailing={trailing}
      />
      <div hidden={!open} className="min-h-0 flex-1">
        {children}
      </div>
    </section>
  );
}
