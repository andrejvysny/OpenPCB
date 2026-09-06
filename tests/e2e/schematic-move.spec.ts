import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Schematic move regressions. Parts are located and tracked by scanning for
 * their saturated-blue pin dots on the WebGL canvas, so the tests are
 * independent of camera math and work in both themes (text/body strokes are
 * excluded by the color predicate). Covered:
 *  - dragging must not flash the part (or wires) back to the pre-drag
 *    position while the move commands + projection refresh are in flight
 *    (optimistic `pendingMove` overlay in SchematicCanvas);
 *  - release ends the move — the part must NOT keep following the cursor
 *    (ref-based drag lifecycle; no extra click-to-place);
 *  - a plain click selects without moving (DRAG_THRESHOLD_PX arming);
 *  - an immediate re-grab while the previous move is still saving must seed
 *    from the optimistic positions (`effectiveProjection`), not the stale
 *    projection — the pre-fix failure teleported the part back and stretched
 *    its wires to ghost endpoints.
 */

const API = "http://127.0.0.1:3000/api/modules";

function pinDef(id: string, number: string, x: number) {
  return {
    id,
    name: id,
    number,
    electricalType: "passive",
    positionMm: { x, y: 0 },
    lengthMm: 1,
    rotationDeg: 0,
    unit: 1,
    hidden: false,
  };
}

async function importDrawnComponent(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API}/library/imports/drawn`, {
    data: {
      drawnSymbol: {
        source: {
          name: "MoveProbe",
          unitCount: 1,
          referenceText: "U?",
          valueText: "MoveProbe",
          pins: [pinDef("pin-1", "1", -2), pinDef("pin-2", "2", 2)],
          graphics: [
            {
              unit: 1,
              graphic: {
                kind: "rect",
                x: -1,
                y: -0.8,
                width: 2,
                height: 1.6,
                fill: "none",
                strokeWidthMm: 0.12,
              },
            },
          ],
          warnings: [],
        },
        referencePrefix: "U",
      },
      footprintMode: "none",
      component: { name: "Move Probe", description: "drag regression probe" },
    },
  });
  expect(response.status()).toBe(201);
  const body = (await response.json()) as { data?: { componentId?: string } };
  if (!body.data?.componentId) throw new Error("drawn import failed");
  return body.data.componentId;
}

async function dispatch(
  request: APIRequestContext,
  designId: string,
  baseRevision: number,
  command: Record<string, unknown>,
): Promise<void> {
  const response = await request.post(`${API}/designer/designs/${designId}/commands`, {
    data: {
      commandId: crypto.randomUUID(),
      sessionId: "e2e-move",
      aggregateId: designId,
      baseRevision,
      issuedAt: Date.now(),
      command,
    },
  });
  expect(response.ok()).toBeTruthy();
}

interface BlueStats {
  count: number;
  cx: number;
  cy: number;
}

interface DotCluster {
  cx: number;
  cy: number;
  count: number;
}

/** Find saturated-blue pin-dot clusters (grouped by x-gaps), left→right. */
async function blueClusters(page: Page, png: Buffer): Promise<DotCluster[]> {
  return page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const points: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < bitmap.height; y += 1) {
      for (let x = 0; x < bitmap.width; x += 1) {
        const i = (y * bitmap.width + x) * 4;
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        if (b > 140 && r < 110 && b - g > 50) points.push({ x, y });
      }
    }
    points.sort((p, q) => p.x - q.x);
    const clusters: Array<{ xs: number[]; ys: number[] }> = [];
    for (const p of points) {
      const last = clusters[clusters.length - 1];
      const lastX = last ? last.xs[last.xs.length - 1]! : null;
      if (last && lastX !== null && p.x - lastX <= 40) {
        last.xs.push(p.x);
        last.ys.push(p.y);
      } else {
        clusters.push({ xs: [p.x], ys: [p.y] });
      }
    }
    return clusters.map((c) => ({
      cx: c.xs.reduce((a, v) => a + v, 0) / c.xs.length,
      cy: c.ys.reduce((a, v) => a + v, 0) / c.ys.length,
      count: c.xs.length,
    }));
  }, png.toString("base64"));
}

/** Decode a PNG in the browser and count saturated-blue pixels (schematic pin
 *  dots) within a canvas-relative region. Text, body strokes, wires, and the
 *  selection halo do not satisfy the predicate in either theme. */
async function blueStats(
  page: Page,
  png: Buffer,
  region: { x: number; y: number; w: number; h: number },
): Promise<BlueStats> {
  return page.evaluate(
    async ({ b64, region }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const clampedX = Math.max(0, Math.floor(region.x));
      const clampedY = Math.max(0, Math.floor(region.y));
      const w = Math.min(Math.floor(region.w), bitmap.width - clampedX);
      const h = Math.min(Math.floor(region.h), bitmap.height - clampedY);
      if (w <= 0 || h <= 0) return { count: 0, cx: 0, cy: 0 };
      const data = ctx.getImageData(clampedX, clampedY, w, h).data;
      let count = 0;
      let sx = 0;
      let sy = 0;
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 4;
          const r = data[i]!;
          const g = data[i + 1]!;
          const b = data[i + 2]!;
          if (b > 140 && r < 110 && b - g > 50) {
            count += 1;
            sx += x;
            sy += y;
          }
        }
      }
      return {
        count,
        cx: clampedX + (count ? sx / count : w / 2),
        cy: clampedY + (count ? sy / count : h / 2),
      };
    },
    { b64: png.toString("base64"), region },
  );
}

interface MoveScene {
  designId: string;
  canvas: ReturnType<Page["locator"]>;
  box: { x: number; y: number; width: number; height: number };
  /** Page coords of part A's body center (safe grab point). */
  grabX: number;
  grabY: number;
  /** Canvas-relative coords of part A's pin-pair center. */
  originCx: number;
  originCy: number;
  pinSpanPx: number;
}

/** Seed two wired parts via the API, open the design, and locate part A by
 *  its two leftmost pin-dot clusters. Unique design name per test — the dev
 *  DB persists across tests, so a shared name would open a stale design. */
async function seedAndOpenScene(
  page: Page,
  request: APIRequestContext,
  designName: string,
): Promise<MoveScene> {
  const componentId = await importDrawnComponent(request);
  const createResponse = await request.post(`${API}/designer/designs`, {
    data: { name: designName },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as {
    data?: { design?: { id?: string } };
  };
  const designId = created.data?.design?.id;
  if (!designId) throw new Error("design create failed");

  await dispatch(request, designId, 0, {
    type: "place_part",
    componentId,
    positionNm: { x: 0, y: 0 },
  });
  await dispatch(request, designId, 1, {
    type: "place_part",
    componentId,
    positionNm: { x: 20_000_000, y: 0 },
  });
  const projectionResponse = await request.get(
    `${API}/designer/designs/${designId}/projection/schematic`,
  );
  const projection = (await projectionResponse.json()) as {
    data?: {
      projection?: {
        parts?: Array<{ id: string; pins: Array<{ id: string }> }>;
      };
    };
  };
  const parts = projection.data?.projection?.parts ?? [];
  const pinA = parts[0]?.pins[1]?.id;
  const pinB = parts[1]?.pins[0]?.id;
  if (!pinA || !pinB) throw new Error("expected two placed parts with pins");
  await dispatch(request, designId, 2, {
    type: "create_wire",
    sourcePinId: pinA,
    targetPinId: pinB,
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Designs" })).toBeVisible();
  // Home list rows select on click; open with a double-click (Enter also works).
  await page.getByText(designName).first().dblclick();
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(700); // camera + first projection render

  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no bounding box");

  // Part A's pins are the two leftmost pin-dot clusters; the midpoint
  // between them is the symbol body center — a safe grab point (clicking a
  // pin dot itself would start a wire draw instead of a drag).
  const before = await canvas.screenshot();
  const clusters = await blueClusters(page, before);
  expect(clusters.length).toBeGreaterThanOrEqual(2);
  const [pinDotA1, pinDotA2] = clusters;
  if (!pinDotA1 || !pinDotA2) throw new Error("expected two pin dots");
  const pinSpanPx = pinDotA2.cx - pinDotA1.cx;
  expect(pinSpanPx).toBeGreaterThan(40); // sane zoom: 4 mm pin span on screen
  return {
    designId,
    canvas,
    box,
    grabX: box.x + (pinDotA1.cx + pinDotA2.cx) / 2,
    grabY: box.y + (pinDotA1.cy + pinDotA2.cy) / 2,
    originCx: (pinDotA1.cx + pinDotA2.cx) / 2,
    originCy: (pinDotA1.cy + pinDotA2.cy) / 2,
    pinSpanPx,
  };
}

interface WireShape {
  pointsNm: Array<{ x: number; y: number }>;
}

/** Fetch the first (only) wire's geometry from the schematic projection. */
async function fetchWire(
  request: APIRequestContext,
  designId: string,
): Promise<WireShape> {
  const response = await request.get(
    `${API}/designer/designs/${designId}/projection/schematic`,
  );
  const body = (await response.json()) as {
    data?: { projection?: { wires?: WireShape[] } };
  };
  const wire = body.data?.projection?.wires?.[0];
  if (!wire) throw new Error("expected a wire in the projection");
  return wire;
}

/** Slow the move commands + projection refetch (as on large designs / slower
 *  machines) so races span several captured frames instead of a single
 *  sub-screenshot-latency blink. */
async function installRouteDelays(page: Page): Promise<void> {
  await page.route(
    "**/api/modules/designer/designs/*/commands",
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.continue();
    },
  );
  await page.route(
    "**/api/modules/designer/designs/*/projection/schematic",
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.continue();
    },
  );
}

function regionAround(
  scene: MoveScene,
  dxPx: number,
  dyPx: number,
): { x: number; y: number; w: number; h: number } {
  // Spans both pins of part A (pin span + margin), vertically tight enough
  // (±35 px) that regions 140 px apart never overlap even after grid
  // snapping (≤ half a grid step ≈ 25 px at this zoom).
  const w = scene.pinSpanPx + 80;
  const h = 70;
  return {
    x: scene.originCx + dxPx - w / 2,
    y: scene.originCy + dyPx - h / 2,
    w,
    h,
  };
}

async function dragBy(
  page: Page,
  fromX: number,
  fromY: number,
  dxPx: number,
  dyPx: number,
): Promise<void> {
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  for (let step = 1; step <= 7; step += 1) {
    await page.mouse.move(
      fromX + (dxPx / 7) * step,
      fromY + (dyPx / 7) * step,
    );
  }
  await page.mouse.up();
}

test("dragging a part keeps it (and wires) at the drop position with no snap-back flash", async ({
  page,
  request,
}) => {
  const scene = await seedAndOpenScene(
    page,
    request,
    `Drag regression ${Date.now()}`,
  );
  await installRouteDelays(page);

  // ── Drag part A straight down by 140 px, then move the cursor away. ──
  const DROP_DY = 140;
  await dragBy(page, scene.grabX, scene.grabY, 0, DROP_DY);
  // Release ended the move: a sticky drag session would make the part chase
  // this post-release cursor move and leave the drop region.
  await page.mouse.move(scene.grabX + 250, scene.grabY - 120);

  // ── The part's pin dots must sit at the drop position in EVERY frame after
  //    release — a snap-back flash renders them at the original position
  //    while the async move commands land. ──
  const newRegion = regionAround(scene, 0, DROP_DY);
  const oldRegion = regionAround(scene, 0, 0);
  for (let frame = 0; frame < 8; frame += 1) {
    const shot = await scene.canvas.screenshot();
    const atNew = await blueStats(page, shot, newRegion);
    const atOld = await blueStats(page, shot, oldRegion);
    expect(
      atNew.count,
      `frame ${frame}: part missing at drop position`,
    ).toBeGreaterThan(5);
    expect(
      atOld.count,
      `frame ${frame}: snap-back flash at origin`,
    ).toBeLessThan(5);
    await page.waitForTimeout(60);
  }
});

test("a plain click selects the part without moving it", async ({
  page,
  request,
}) => {
  const scene = await seedAndOpenScene(
    page,
    request,
    `Click no-move ${Date.now()}`,
  );

  // Click part A's body with a sub-threshold wiggle (< DRAG_THRESHOLD_PX),
  // then move the cursor far away. The part must stay exactly at its origin:
  // no move commit, no cursor-chasing leftover session.
  await page.mouse.move(scene.grabX, scene.grabY);
  await page.mouse.down();
  await page.mouse.move(scene.grabX + 2, scene.grabY + 1);
  await page.mouse.up();
  await page.mouse.move(scene.grabX + 220, scene.grabY + 160);

  const originRegion = regionAround(scene, 0, 0);
  for (let frame = 0; frame < 5; frame += 1) {
    const shot = await scene.canvas.screenshot();
    const atOrigin = await blueStats(page, shot, originRegion);
    expect(
      atOrigin.count,
      `frame ${frame}: click moved the part away from its origin`,
    ).toBeGreaterThan(5);
    await page.waitForTimeout(60);
  }
});

test("dragging a wire segment reshapes the wire while keeping its endpoints pinned", async ({
  page,
  request,
}) => {
  const scene = await seedAndOpenScene(
    page,
    request,
    `Wire segment drag ${Date.now()}`,
  );

  // Precondition: a single straight 2-point wire between the two parts.
  const before = await fetchWire(request, scene.designId);
  expect(before.pointsNm.length).toBe(2);
  const src = before.pointsNm[0]!;
  const tgt = before.pointsNm[before.pointsNm.length - 1]!;

  // Fit the whole schematic so both parts + the full wire are on-screen, then
  // grab the wire's midpoint between part A's right pin (cluster 1) and part
  // B's left pin (cluster 2) — well clear of every pin dot and body text.
  await page.getByRole("button", { name: "Fit schematic" }).click();
  await page.waitForTimeout(500);
  const shot = await scene.canvas.screenshot();
  const clusters = await blueClusters(page, shot);
  expect(clusters.length).toBeGreaterThanOrEqual(4); // A(2 pins) + B(2 pins)
  const aRight = clusters[1]!;
  const bLeft = clusters[2]!;
  const wireX = scene.box.x + (aRight.cx + bLeft.cx) / 2;
  const wireY = scene.box.y + (aRight.cy + bLeft.cy) / 2;

  await dragBy(page, wireX, wireY, 0, 120);

  // The update_wire_geometry command dispatches async — wait for the wire to
  // gain interior waypoints (a straight run becomes a 4-point staple).
  await expect
    .poll(
      async () => (await fetchWire(request, scene.designId)).pointsNm.length,
      { timeout: 5000 },
    )
    .toBeGreaterThan(2);

  const after = await fetchWire(request, scene.designId);
  // Endpoints stay welded to the same pins.
  expect(after.pointsNm[0]).toEqual(src);
  expect(after.pointsNm[after.pointsNm.length - 1]).toEqual(tgt);
  // Every segment stays orthogonal (Manhattan).
  for (let i = 1; i < after.pointsNm.length; i += 1) {
    const a = after.pointsNm[i - 1]!;
    const b = after.pointsNm[i]!;
    expect(a.x === b.x || a.y === b.y).toBe(true);
  }
  // The interior run moved off the endpoints' row — the segment actually slid.
  const movedOff = after.pointsNm
    .slice(1, -1)
    .some((p) => p.y !== src.y);
  expect(movedOff).toBe(true);
});

test("an immediate re-grab while the previous move is still saving stays consistent", async ({
  page,
  request,
}) => {
  const scene = await seedAndOpenScene(
    page,
    request,
    `Re-grab mid-flight ${Date.now()}`,
  );
  await installRouteDelays(page);

  // First drag: 140 px down. With the injected delays its move commands +
  // projection refetch are still in flight while the second drag runs.
  const DY = 140;
  // Far enough right that the final pin dots can never fall inside the
  // intermediate assertion region regardless of zoom (region half-width is
  // pinSpan/2 + 40; the final left pin lands at DX − pinSpan/2).
  const DX = Math.ceil(scene.pinSpanPx + 120);
  await dragBy(page, scene.grabX, scene.grabY, 0, DY);
  // Immediately re-grab at the part's NEW visual position and drag 180 px
  // right. Pre-fix this seeded from the stale projection: the part teleported
  // back to its origin and the second commit landed at origin+dx (losing the
  // first move), stretching its wires to ghost endpoints.
  await dragBy(page, scene.grabX, scene.grabY + DY, DX, 0);

  const finalRegion = regionAround(scene, DX, DY);
  const intermediateRegion = regionAround(scene, 0, DY);
  const originRegion = regionAround(scene, 0, 0);
  for (let frame = 0; frame < 10; frame += 1) {
    const shot = await scene.canvas.screenshot();
    const atFinal = await blueStats(page, shot, finalRegion);
    const atIntermediate = await blueStats(page, shot, intermediateRegion);
    const atOrigin = await blueStats(page, shot, originRegion);
    expect(
      atFinal.count,
      `frame ${frame}: part missing at final position`,
    ).toBeGreaterThan(5);
    expect(
      atIntermediate.count,
      `frame ${frame}: part flashed back to the first drop position`,
    ).toBeLessThan(5);
    expect(
      atOrigin.count,
      `frame ${frame}: part teleported back to its origin`,
    ).toBeLessThan(5);
    await page.waitForTimeout(60);
  }
});
