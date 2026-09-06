import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { MoreHorizontal } from "lucide-react";
import { TableRow } from "@shared/frontend/ui/data-table";

export interface OutlineRowAction {
  label: string;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect(): void;
}

interface OutlineRowProps {
  /** `grid-template-columns` for this tab's table; must match the header. */
  cols: string;
  /** The row's cells, one per column. */
  children: ReactNode;
  /** Value seeded into the inline rename input. */
  renameValue: string;
  selected: boolean;
  onSelect(): void;
  onActivate?(): void;
  actions?: OutlineRowAction[];
  renaming?: boolean;
  onRenameCommit?(value: string): void;
  onRenameCancel?(): void;
}

/** One 22px outline row (design D2 §6). */
export function OutlineRow({
  cols,
  children,
  renameValue,
  selected,
  onSelect,
  onActivate,
  actions,
  renaming,
  onRenameCommit,
  onRenameCancel,
}: OutlineRowProps): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (!(event.target instanceof Node)) return;
      if (!wrapperRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [menuOpen]);

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (!actions || actions.length === 0) return;
    event.preventDefault();
    setMenuPos({ x: event.clientX, y: event.clientY });
    setMenuOpen(true);
    onSelect();
  };

  const handleKebabClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!actions || actions.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom });
    setMenuOpen((prev) => !prev);
  };

  const commitRename = () => {
    const value = inputRef.current?.value.trim() ?? "";
    if (value.length === 0) {
      onRenameCancel?.();
      return;
    }
    onRenameCommit?.(value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onRenameCancel?.();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <TableRow
        cols={renaming ? "1fr" : cols}
        selected={selected}
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onDoubleClick={onActivate}
        onContextMenu={handleContextMenu}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          } else if (event.key === "F2") {
            const renameAction = actions?.find((a) => a.label === "Rename");
            if (renameAction && !renameAction.disabled) {
              event.preventDefault();
              renameAction.onSelect();
            }
          } else if (event.key === "Delete" || event.key === "Backspace") {
            const deleteAction = actions?.find((a) => a.label === "Delete");
            if (deleteAction && !deleteAction.disabled) {
              event.preventDefault();
              deleteAction.onSelect();
            }
          }
        }}
        className="group relative cursor-pointer gap-1.5 outline-none focus-visible:bg-surface-hover"
      >
        {renaming ? (
          <input
            ref={inputRef}
            defaultValue={renameValue}
            aria-label="Rename"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleInputKeyDown}
            onBlur={commitRename}
            className="h-[18px] min-w-0 rounded-control border border-selection bg-surface-input px-1 font-mono text-xs text-text-strong outline-none"
          />
        ) : (
          <>
            {children}
            {actions && actions.length > 0 ? (
              <button
                type="button"
                onClick={handleKebabClick}
                aria-label="Actions"
                className={`absolute right-1 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-control text-text-tertiary opacity-0 transition-opacity hover:bg-surface-control hover:text-text-strong group-hover:opacity-100 ${
                  selected ? "opacity-100" : ""
                }`}
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            ) : null}
          </>
        )}
      </TableRow>
      {menuOpen && menuPos && actions ? (
        <div
          role="menu"
          style={{ position: "fixed", top: menuPos.y, left: menuPos.x }}
          className="z-50 min-w-[9rem] rounded-float border border-border bg-surface-raised py-1 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={(event) => {
                event.stopPropagation();
                if (action.disabled) return;
                setMenuOpen(false);
                action.onSelect();
              }}
              className={`flex w-full items-center justify-between gap-3 px-2 py-1 text-left text-xs transition-colors ${
                action.disabled
                  ? "cursor-not-allowed text-text-disabled"
                  : action.destructive
                    ? "text-status-danger hover:bg-surface-hover"
                    : "text-text hover:bg-surface-hover hover:text-text-strong"
              }`}
            >
              <span>{action.label}</span>
              {action.shortcut ? (
                <kbd className="rounded-control border border-border-control px-1 font-mono text-2xs text-text-tertiary">
                  {action.shortcut}
                </kbd>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
