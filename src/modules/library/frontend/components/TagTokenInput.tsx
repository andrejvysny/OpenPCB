import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import type { LibraryTagStat } from "../../../../sdks/library";
import { normalizeTag } from "../tag-grouping";
import { TagChip } from "./TagChip";

interface TagTokenInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: LibraryTagStat[];
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  /** Show dropdown only when the input is focused. */
  autoFocus?: boolean;
}

const COMMIT_KEYS = new Set(["Enter", ",", "Tab"]);

export function TagTokenInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add a tag…",
  disabled = false,
  maxSuggestions = 8,
  autoFocus = false,
}: TagTokenInputProps): ReactElement {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const commitTag = useCallback(
    (raw: string) => {
      const normalized = normalizeTag(raw);
      if (!normalized) return;
      if (value.includes(normalized)) {
        setDraft("");
        return;
      }
      onChange([...value, normalized]);
      setDraft("");
      setActiveSuggestion(0);
    },
    [onChange, value],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((entry) => entry !== tag));
    },
    [onChange, value],
  );

  const filteredSuggestions = useMemo(() => {
    const normalizedDraft = normalizeTag(draft);
    const valueSet = new Set(value);
    const list = suggestions
      .filter((stat) => !valueSet.has(stat.tag))
      .filter((stat) =>
        normalizedDraft.length === 0
          ? true
          : stat.tag.includes(normalizedDraft),
      );
    return list.slice(0, maxSuggestions);
  }, [draft, suggestions, value, maxSuggestions]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (COMMIT_KEYS.has(event.key)) {
        const picked =
          focused && filteredSuggestions.length > 0 && draft.length > 0
            ? filteredSuggestions[activeSuggestion]
            : undefined;
        if (event.key !== "Tab") {
          event.preventDefault();
        }
        if (picked) {
          commitTag(picked.tag);
        } else if (draft.trim().length > 0) {
          commitTag(draft);
        }
        return;
      }
      if (event.key === "Backspace" && draft.length === 0 && value.length > 0) {
        event.preventDefault();
        const last = value[value.length - 1]!;
        removeTag(last);
        return;
      }
      if (event.key === "ArrowDown") {
        if (filteredSuggestions.length === 0) return;
        event.preventDefault();
        setActiveSuggestion((prev) => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        if (filteredSuggestions.length === 0) return;
        event.preventDefault();
        setActiveSuggestion(
          (prev) =>
            (prev - 1 + filteredSuggestions.length) %
            filteredSuggestions.length,
        );
        return;
      }
      if (event.key === "Escape") {
        if (draft.length > 0) {
          event.preventDefault();
          setDraft("");
        }
      }
    },
    [
      activeSuggestion,
      commitTag,
      draft,
      filteredSuggestions,
      focused,
      removeTag,
      value,
    ],
  );

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-control border bg-surface-input px-2 py-1.5 text-xs ${
          disabled
            ? "border-border opacity-60"
            : "border-border-control focus-within:border-selection"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <TagChip
            key={tag}
            label={tag}
            removable={!disabled}
            onRemove={() => removeTag(tag)}
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setActiveSuggestion(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (blurTimerRef.current !== null) {
              window.clearTimeout(blurTimerRef.current);
              blurTimerRef.current = null;
            }
            setFocused(true);
          }}
          onBlur={() => {
            // Delay so suggestion-click handlers fire before the dropdown unmounts.
            blurTimerRef.current = window.setTimeout(() => {
              if (draft.trim().length > 0) {
                commitTag(draft);
              }
              setFocused(false);
            }, 120);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="min-w-[8rem] flex-1 bg-transparent text-xs text-text-strong outline-none placeholder:text-text-disabled"
        />
      </div>
      {focused && filteredSuggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-float border border-border bg-surface-raised py-1 shadow-lg"
        >
          {filteredSuggestions.map((stat, index) => {
            const active = index === activeSuggestion;
            return (
              <li key={stat.tag}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => commitTag(stat.tag)}
                  onMouseEnter={() => setActiveSuggestion(index)}
                  className={`flex w-full items-center justify-between px-2 py-1 text-left text-xs outline-none transition-colors ${
                    active
                      ? "bg-surface-selected text-text-strong"
                      : "text-text hover:bg-surface-hover hover:text-text-strong"
                  }`}
                >
                  <span className="truncate">{stat.tag}</span>
                  <span className="font-mono text-2xs tabular-nums text-text-disabled">
                    {stat.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
