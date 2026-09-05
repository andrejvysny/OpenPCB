import type { ReactElement } from "react";

export function DesignerPlaceholderView({
  view,
}: {
  view: "pcb" | "3d" | "bom";
}): ReactElement {
  return (
    <div className="flex h-full items-center justify-center bg-surface-app text-center text-text-secondary">
      <div>
        <h3 className="text-lg font-medium uppercase tracking-[.04em] text-text-strong">
          {view}
        </h3>
        <p className="mt-2 text-xs text-text-tertiary">Coming soon</p>
      </div>
    </div>
  );
}
