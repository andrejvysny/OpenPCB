import { create } from "zustand";

interface WindowTitleState {
  /**
   * Context appended to the app name in the window title bar — typically the
   * open design's name. `null` while nothing contextual is open.
   */
  subtitle: string | null;
  setSubtitle(subtitle: string | null): void;
}

/**
 * Window-title context. Screens push what they are showing (e.g. the active
 * design name); `TitleBar` renders `OpenPCB — {subtitle}` and mirrors the same
 * value onto `document.title`.
 */
export const useWindowTitleStore = create<WindowTitleState>((set) => ({
  subtitle: null,
  setSubtitle: (subtitle) =>
    set((state) => (state.subtitle === subtitle ? state : { subtitle })),
}));
