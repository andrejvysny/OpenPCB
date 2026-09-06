import { create } from "zustand";

export interface SchematicCursorPoint {
  xMm: number;
  yMm: number;
}

interface SchematicCursorState {
  point: SchematicCursorPoint | null;
  setPoint: (point: SchematicCursorPoint | null) => void;
}

/**
 * Sheet-space cursor position for the schematic status-bar readout. The PCB
 * equivalent lives in `pcb/pcb-cursor-store`; the two stay separate stores so
 * neither editor's pointer stream can wake the other's status bar.
 *
 * Kept outside `Space.tsx` state on purpose: the canvas reports every pointer
 * move, and routing that through the editor shell would re-render the whole
 * designer at mouse-move frequency. Only the readout segment subscribes.
 */
export const useSchematicCursorStore = create<SchematicCursorState>((set) => ({
  point: null,
  setPoint: (point) => set({ point }),
}));

/** Stable setter for `SchematicCanvas`'s `onCursorChange` prop. */
export const setSchematicCursorPoint = (
  point: SchematicCursorPoint | null,
): void => useSchematicCursorStore.getState().setPoint(point);
