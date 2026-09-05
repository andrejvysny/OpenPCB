import { beforeEach, describe, expect, test } from "vitest";
import {
  DEFAULT_DOCK_TAB,
  DEFAULT_DOCK_WIDTH,
  DOCK_OPEN_KEY,
  DOCK_TAB_KEY,
  DOCK_WIDTH_KEY,
  LEGACY_CHAT_OPEN_KEY,
  LEGACY_CHAT_WIDTH_KEY,
  LEGACY_DRC_WIDTH_KEY,
  LEGACY_INSPECTOR_OPEN_KEY,
  LEGACY_INSPECTOR_WIDTH_KEY,
  MAX_DOCK_WIDTH,
  MIN_DOCK_WIDTH,
  readDockPrefs,
  writeDockPrefs,
  type DockPrefsStorage,
} from "./designer-dock-prefs";

/** jsdom isn't enabled for this workspace — pass an explicit memory storage. */
function memoryStorage(seed: Record<string, string> = {}): DockPrefsStorage & {
  data: Record<string, string>;
} {
  const data: Record<string, string> = { ...seed };
  return {
    data,
    getItem: (k) => (k in data ? (data[k] as string) : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("designer-dock-prefs", () => {
  let store: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    store = memoryStorage();
  });

  test("nothing stored → defaults (300 px, open, properties)", () => {
    expect(readDockPrefs(store)).toEqual({
      open: true,
      width: DEFAULT_DOCK_WIDTH,
      tab: DEFAULT_DOCK_TAB,
    });
  });

  test("no storage at all → defaults", () => {
    expect(readDockPrefs(null)).toEqual({
      open: true,
      width: 300,
      tab: "properties",
    });
  });

  test('legacy chat-open "1" migrates to the assistant tab, open', () => {
    const legacy = memoryStorage({ [LEGACY_CHAT_OPEN_KEY]: "1" });
    const prefs = readDockPrefs(legacy);
    expect(prefs.tab).toBe("assistant");
    expect(prefs.open).toBe(true);
  });

  test('legacy chat-open "true" migrates the same way', () => {
    const legacy = memoryStorage({ [LEGACY_CHAT_OPEN_KEY]: "true" });
    expect(readDockPrefs(legacy).tab).toBe("assistant");
  });

  test("legacy chat closed keeps the properties tab", () => {
    const legacy = memoryStorage({ [LEGACY_CHAT_OPEN_KEY]: "false" });
    const prefs = readDockPrefs(legacy);
    expect(prefs.tab).toBe("properties");
    expect(prefs.open).toBe(true);
  });

  test("legacy inspector width seeds the dock width", () => {
    const legacy = memoryStorage({ [LEGACY_INSPECTOR_WIDTH_KEY]: "420" });
    expect(readDockPrefs(legacy).width).toBe(420);
  });

  test("legacy inspector width wins over drc + chat widths", () => {
    const legacy = memoryStorage({
      [LEGACY_INSPECTOR_WIDTH_KEY]: "300",
      [LEGACY_DRC_WIDTH_KEY]: "400",
      [LEGACY_CHAT_WIDTH_KEY]: "500",
    });
    expect(readDockPrefs(legacy).width).toBe(300);
  });

  test("legacy drc width is used when no inspector width exists", () => {
    const legacy = memoryStorage({ [LEGACY_DRC_WIDTH_KEY]: "410" });
    expect(readDockPrefs(legacy).width).toBe(410);
  });

  test("legacy inspector-open false closes the dock", () => {
    const legacy = memoryStorage({ [LEGACY_INSPECTOR_OPEN_KEY]: "false" });
    expect(readDockPrefs(legacy).open).toBe(false);
  });

  test("legacy widths outside the new bounds are clamped", () => {
    expect(readDockPrefs(memoryStorage({ [LEGACY_CHAT_WIDTH_KEY]: "40" })).width).toBe(
      MIN_DOCK_WIDTH,
    );
    expect(
      readDockPrefs(memoryStorage({ [LEGACY_CHAT_WIDTH_KEY]: "5000" })).width,
    ).toBe(MAX_DOCK_WIDTH);
  });

  test("new keys win over legacy keys", () => {
    const mixed = memoryStorage({
      [DOCK_OPEN_KEY]: "false",
      [DOCK_WIDTH_KEY]: "340",
      [DOCK_TAB_KEY]: "drc",
      [LEGACY_CHAT_OPEN_KEY]: "1",
      [LEGACY_INSPECTOR_WIDTH_KEY]: "420",
    });
    expect(readDockPrefs(mixed)).toEqual({
      open: false,
      width: 340,
      tab: "drc",
    });
  });

  test("a partially written new profile falls back per-field, not to legacy", () => {
    const partial = memoryStorage({
      [DOCK_TAB_KEY]: "assistant",
      [LEGACY_INSPECTOR_WIDTH_KEY]: "420",
    });
    expect(readDockPrefs(partial)).toEqual({
      open: true,
      width: DEFAULT_DOCK_WIDTH,
      tab: "assistant",
    });
  });

  test("an unknown persisted tab falls back to properties", () => {
    const bogus = memoryStorage({ [DOCK_TAB_KEY]: "wat", [DOCK_OPEN_KEY]: "true" });
    expect(readDockPrefs(bogus).tab).toBe("properties");
  });

  test("writeDockPrefs round-trips and clamps the width", () => {
    writeDockPrefs({ open: false, width: 9000, tab: "drc" }, store);
    expect(store.data[DOCK_WIDTH_KEY]).toBe(String(MAX_DOCK_WIDTH));
    expect(readDockPrefs(store)).toEqual({
      open: false,
      width: MAX_DOCK_WIDTH,
      tab: "drc",
    });
  });

  test("writeDockPrefs is a no-op without storage", () => {
    expect(() => writeDockPrefs({ open: true, width: 300, tab: "properties" }, null)).not.toThrow();
  });
});
