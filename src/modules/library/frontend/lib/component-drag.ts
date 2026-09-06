import type { DragEvent } from "react";
import type { LibraryComponent } from "../../../../sdks/library";

/**
 * Cross-module drag-and-drop contract: the schematic canvas reads this MIME
 * type to place a library part. Changing it breaks placement — keep verbatim.
 */
export const DRAG_MIME_TYPE = "application/x-openpcb-library-component";

/** The subset of a component the drop handler needs. */
export type DraggableComponent = Pick<
  LibraryComponent,
  "id" | "symbolId" | "footprintId" | "name"
>;

/** The exact payload shape the drop handler parses out of `DRAG_MIME_TYPE`. */
export function componentDragPayload(component: DraggableComponent): string {
  return JSON.stringify({
    componentId: component.id,
    symbolId: component.symbolId,
    footprintId: component.footprintId,
    name: component.name,
  });
}

/**
 * Writes the library-component drag payload onto a drag event. Shared by the
 * card grid and the table so both rows and cards drop identically.
 */
export function setComponentDragData(
  event: DragEvent<Element>,
  component: DraggableComponent,
): void {
  event.dataTransfer.setData(DRAG_MIME_TYPE, componentDragPayload(component));
  event.dataTransfer.setData("text/plain", component.name);
  event.dataTransfer.effectAllowed = "copy";
}
