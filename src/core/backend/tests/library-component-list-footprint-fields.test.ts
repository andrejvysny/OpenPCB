import { describe, expect, test } from "bun:test";
import os from "node:os";
import path from "node:path";
import type { LibraryComponent } from "../../../sdks/library";
import {
  getSharedSqlite,
  resetSharedSqliteForTesting,
} from "../db/sqlite-client";
import { createHttpServer } from "../http/create-http-server";
import { DiagnosticsStore } from "../diagnostics/diagnostics-store";
import { ModuleRuntime } from "../modules/module-loader";
import { ModuleRouterRegistry } from "../router/module-registry";

async function bootServer(label: string) {
  resetSharedSqliteForTesting();
  process.env.OPENPCB_DB_PATH = path.join(
    os.tmpdir(),
    `${label}-${Date.now()}-${crypto.randomUUID()}.sqlite`,
  );
  const moduleRegistry = new ModuleRouterRegistry();
  const moduleRuntime = new ModuleRuntime({
    moduleRegistry,
    workspaceRoot: path.resolve(import.meta.dir, "../../.."),
  });
  await moduleRuntime.bootstrap();
  return createHttpServer({
    diagnosticsStore: new DiagnosticsStore(),
    moduleRegistry,
    moduleRuntime,
  });
}

/**
 * Seed a user component. `footprint` null means the component points at a
 * footprint row that does not exist — the list join then yields no blob, which
 * is the "no footprint" case the DTO reports as null/null.
 */
function seedComponent(options: {
  name: string;
  footprint: { mountType?: string; padCount?: number; pads?: unknown[] } | null;
}): string {
  const db = getSharedSqlite();
  const now = new Date().toISOString();
  const componentId = crypto.randomUUID();
  const symbolId = crypto.randomUUID();
  const footprintId = crypto.randomUUID();

  db.query(
    "INSERT INTO library_symbols (id, name, data_json, created_at) VALUES (?, ?, ?, ?)",
  ).run(symbolId, `${options.name} Symbol`, JSON.stringify({}), now);

  if (options.footprint) {
    db.query(
      "INSERT INTO library_footprints (id, name, data_json, created_at) VALUES (?, ?, ?, ?)",
    ).run(
      footprintId,
      `${options.name} Footprint`,
      JSON.stringify({ normalized: options.footprint }),
      now,
    );
  }

  db.query(
    "INSERT INTO library_components (id, name, description, symbol_id, footprint_id, tags_json, created_at, is_builtin) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
  ).run(
    componentId,
    options.name,
    "component list DTO fixture",
    symbolId,
    footprintId,
    JSON.stringify(["user"]),
    now,
  );
  return componentId;
}

async function fetchComponents(
  server: { fetch: (req: Request) => Promise<Response> },
  query: string,
  tags: string[] = [],
): Promise<LibraryComponent[]> {
  const url = new URL("http://localhost/api/modules/library/components");
  if (query) url.searchParams.set("q", query);
  if (tags.length > 0) url.searchParams.set("tags", tags.join(","));
  url.searchParams.set("limit", "60");
  const response = await server.fetch(new Request(url));
  expect(response.status).toBe(200);
  const body = (await response.json()) as {
    data: { components: LibraryComponent[] };
  };
  return body.data.components;
}

describe("component list DTO: mountType + padCount", () => {
  test("populates both from the default footprint, null without one", async () => {
    const server = await bootServer("library-list-footprint-fields");

    seedComponent({
      name: "ZZ List Fixture SMD",
      footprint: { mountType: "smd", padCount: 8 },
    });
    seedComponent({
      name: "ZZ List Fixture THT",
      footprint: { mountType: "through_hole", pads: [{}, {}, {}] },
    });
    seedComponent({ name: "ZZ List Fixture Orphan", footprint: null });

    const rows = await fetchComponents(server, "ZZ List Fixture");
    const byName = new Map(rows.map((row) => [row.name, row]));
    expect(byName.size).toBe(3);

    const smd = byName.get("ZZ List Fixture SMD")!;
    expect(smd.mountType).toBe("SMD");
    expect(smd.padCount).toBe(8);

    // `through_hole` normalises to THT; pad count falls back to `pads.length`.
    const tht = byName.get("ZZ List Fixture THT")!;
    expect(tht.mountType).toBe("THT");
    expect(tht.padCount).toBe(3);

    // No footprint row → both fields null rather than absent/zero.
    const orphan = byName.get("ZZ List Fixture Orphan")!;
    expect(orphan.mountType).toBeNull();
    expect(orphan.padCount).toBeNull();
  });

  test("the filtered (tag) list path carries the same fields", async () => {
    const server = await bootServer("library-list-footprint-fields-filtered");
    seedComponent({
      name: "ZZ Filtered Fixture",
      footprint: { mountType: "smd", padCount: 2 },
    });

    const rows = await fetchComponents(server, "", ["user"]);
    const row = rows.find((r) => r.name === "ZZ Filtered Fixture");
    expect(row).toBeDefined();
    expect(row!.mountType).toBe("SMD");
    expect(row!.padCount).toBe(2);
  });
});
