import type { ReactElement } from "react";
import { BookOpen, Plus, Tag } from "lucide-react";
import { Button } from "@shared/frontend/ui/button";

interface OutlineEmptyStateProps {
  onPlaceComponent(): void;
  onAddNetLabel(): void;
  onBrowseLibrary(): void;
}

export function OutlineEmptyState({
  onPlaceComponent,
  onAddNetLabel,
  onBrowseLibrary,
}: OutlineEmptyStateProps): ReactElement {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div>
        <p className="text-xs font-medium text-text-strong">Empty design</p>
        <p className="mt-1 text-2xs leading-snug text-text-tertiary">
          Add your first component, label, or browse the library to get started.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          variant="primary"
          onClick={onPlaceComponent}
          className="justify-between"
          icon={<Plus className="h-3 w-3" />}
        >
          <span className="mr-auto pl-1.5">Place component</span>
          <kbd className="font-mono text-2xs opacity-70">⌘K</kbd>
        </Button>
        <Button
          variant="secondary"
          onClick={onAddNetLabel}
          className="justify-start"
          icon={<Tag className="h-3 w-3 text-text-tertiary" />}
        >
          Add net label
        </Button>
        <Button
          variant="secondary"
          onClick={onBrowseLibrary}
          className="justify-start"
          icon={<BookOpen className="h-3 w-3 text-text-tertiary" />}
        >
          Browse library
        </Button>
      </div>
    </div>
  );
}
