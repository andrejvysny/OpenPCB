import type { ReactElement } from "react";
import { X } from "lucide-react";

export type TagChipSize = "sm" | "md";

interface TagChipProps {
  label: string;
  count?: number;
  active?: boolean;
  removable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: TagChipSize;
  title?: string;
}

export function TagChip({
  label,
  count,
  active = false,
  removable = false,
  disabled = false,
  onClick,
  onRemove,
  size = "sm",
  title,
}: TagChipProps): ReactElement {
  const dimensions =
    size === "md" ? "h-[22px] px-2 text-xs" : "h-[18px] px-1.5 text-2xs";

  const tone = active
    ? "border-border-control bg-surface-control text-text-strong"
    : "border-border-control text-text hover:bg-surface-hover hover:text-text-strong";

  const disabledTone = disabled ? "cursor-not-allowed opacity-50" : "";

  const Tag: "button" | "span" = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      title={title ?? label}
      className={`inline-flex items-center gap-1 rounded-control border transition-colors outline-none ${dimensions} ${tone} ${disabledTone}`}
    >
      <span className="max-w-[12rem] truncate">{label}</span>
      {typeof count === "number" && (
        <span
          className={`font-mono text-2xs tabular-nums ${
            active ? "text-text-secondary" : "text-text-disabled"
          }`}
        >
          {count}
        </span>
      )}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove tag ${label}`}
          className="-mr-0.5 ml-0.5 inline-flex h-3 w-3 items-center justify-center text-text-tertiary outline-none hover:text-text-strong"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </Tag>
  );
}
