/**
 * Persisted preferences for the designer's single right dock.
 *
 * The editor used to stack three independent right docks (schematic selection
 * inspector, PCB DRC results, assistant chat), each with its own open flag and
 * width. They are now one tabbed dock, so the three key families collapse into
 * `dock-open` / `dock-width` / `dock-tab`.
 *
 * The legacy keys are read once (never written again) so a returning user keeps
 * roughly the layout they left: a user who had the chat dock open lands on the
 * Assistant tab, and the inspector's width seeds the dock width.
 */

export type DockTab = "properties" | "drc" | "erc" | "assistant";

export const DOCK_OPEN_KEY = "openpcb:designer:dock-open";
export const DOCK_WIDTH_KEY = "openpcb:designer:dock-width";
export const DOCK_TAB_KEY = "openpcb:designer:dock-tab";

/** Pre-consolidation keys. Read for migration only — never written. */
export const LEGACY_CHAT_OPEN_KEY = "openpcb:designer:chat-open";
export const LEGACY_CHAT_WIDTH_KEY = "openpcb:designer:chat-width";
export const LEGACY_INSPECTOR_OPEN_KEY = "openpcb:designer:inspector-open";
export const LEGACY_INSPECTOR_WIDTH_KEY = "openpcb:designer:inspector-width";
export const LEGACY_DRC_WIDTH_KEY = "openpcb:designer:drc-width";

export const MIN_DOCK_WIDTH = 260;
export const MAX_DOCK_WIDTH = 560;
export const DEFAULT_DOCK_WIDTH = 300;
export const DEFAULT_DOCK_TAB: DockTab = "properties";
export const DEFAULT_DOCK_OPEN = true;

export interface DockPrefs {
  open: boolean;
  width: number;
  tab: DockTab;
}

/** Minimal slice of the Storage API this module needs. */
export interface DockPrefsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): DockPrefsStorage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function clampWidth(value: number): number {
  return Math.min(MAX_DOCK_WIDTH, Math.max(MIN_DOCK_WIDTH, Math.round(value)));
}

/** Accepts both the historical `"true"/"false"` and `"1"/"0"` encodings. */
function readBoolean(raw: string | null): boolean | null {
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return null;
}

function readNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function isDockTab(value: string | null): value is DockTab {
  return (
    value === "properties" ||
    value === "drc" ||
    value === "erc" ||
    value === "assistant"
  );
}

/**
 * Read the dock preferences, migrating from the pre-consolidation keys when the
 * new ones are absent. Never throws — a blocked/unavailable localStorage simply
 * yields the defaults (300 px, open, Properties).
 */
export function readDockPrefs(
  storage: DockPrefsStorage | null = defaultStorage(),
): DockPrefs {
  const fallback: DockPrefs = {
    open: DEFAULT_DOCK_OPEN,
    width: DEFAULT_DOCK_WIDTH,
    tab: DEFAULT_DOCK_TAB,
  };
  if (!storage) return fallback;

  const get = (key: string): string | null => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };

  const newOpen = readBoolean(get(DOCK_OPEN_KEY));
  const newWidth = readNumber(get(DOCK_WIDTH_KEY));
  const rawTab = get(DOCK_TAB_KEY);
  const newTab = isDockTab(rawTab) ? rawTab : null;

  // Any of the new keys present → this profile has already been migrated.
  if (newOpen !== null || newWidth !== null || newTab !== null) {
    return {
      open: newOpen ?? DEFAULT_DOCK_OPEN,
      width: newWidth === null ? DEFAULT_DOCK_WIDTH : clampWidth(newWidth),
      tab: newTab ?? DEFAULT_DOCK_TAB,
    };
  }

  const chatOpen = readBoolean(get(LEGACY_CHAT_OPEN_KEY));
  const inspectorOpen = readBoolean(get(LEGACY_INSPECTOR_OPEN_KEY));
  // Inspector first: it was the default-open dock and its bounds are closest
  // to the new dock's.
  const legacyWidth =
    readNumber(get(LEGACY_INSPECTOR_WIDTH_KEY)) ??
    readNumber(get(LEGACY_DRC_WIDTH_KEY)) ??
    readNumber(get(LEGACY_CHAT_WIDTH_KEY));

  return {
    // The chat dock was opt-in; having it open means the user wanted the
    // assistant, so land on that tab.
    tab: chatOpen === true ? "assistant" : DEFAULT_DOCK_TAB,
    open: chatOpen === true ? true : (inspectorOpen ?? DEFAULT_DOCK_OPEN),
    width: legacyWidth === null ? DEFAULT_DOCK_WIDTH : clampWidth(legacyWidth),
  };
}

/** Persist the dock preferences. Best-effort — quota/privacy errors are swallowed. */
export function writeDockPrefs(
  prefs: DockPrefs,
  storage: DockPrefsStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(DOCK_OPEN_KEY, String(prefs.open));
    storage.setItem(DOCK_WIDTH_KEY, String(clampWidth(prefs.width)));
    storage.setItem(DOCK_TAB_KEY, prefs.tab);
  } catch {
    // localStorage unavailable — dock prefs are best-effort.
  }
}

export function clampDockWidth(value: number): number {
  return clampWidth(value);
}
