import { create } from "zustand";

export interface PcbCursorPoint {
  xMm: number;
  yMm: number;
}

interface PcbCursorState {
  point: PcbCursorPoint | null;
  setPoint: (point: PcbCursorPoint | null) => void;
}

/**
 * Board-space cursor position for the status-bar readout.
 *
 * Kept outside `Space.tsx` state on purpose: the canvas reports every pointer
 * move, and routing that through the editor shell would re-render the whole
 * designer (and `PcbCanvas` with it) at mouse-move frequency. Only the readout
 * segment subscribes to this store.
 */
export const usePcbCursorStore = create<PcbCursorState>((set) => ({
  point: null,
  setPoint: (point) => set({ point }),
}));

/** Stable setter for `PcbCanvas`'s `onCursorChange` prop. */
export const setPcbCursorPoint = (point: PcbCursorPoint | null): void =>
  usePcbCursorStore.getState().setPoint(point);
