export type NetClass = "ground" | "power" | "signal";

/**
 * Classify a net name into ground / power / signal for color-coding.
 * Mirrors the schematic-editor redesign net palette:
 *   ground  → teal  (#5DCAA5)
 *   power   → coral (#E0573A)
 *   signal  → slate (#94A3B8)
 */
export function classifyNet(name: string): NetClass {
  const trimmed = name.trim().toUpperCase();
  if (!trimmed) return "signal";
  if (/^(A|D|P|E)?GND\d*$/.test(trimmed) || trimmed === "VSS") return "ground";
  if (
    trimmed.startsWith("+") ||
    trimmed === "VCC" ||
    trimmed === "VDD" ||
    trimmed === "VEE" ||
    trimmed === "VIN" ||
    trimmed.startsWith("VBAT")
  ) {
    return "power";
  }
  return "signal";
}

/** True for any power *or* ground rail — used to pick the net-row icon. */
export function isPowerNet(name: string): boolean {
  return classifyNet(name) !== "signal";
}

/** Semantic text-color token class for a net class (both themes). */
export function netClassTextClass(cls: NetClass): string {
  switch (cls) {
    case "ground":
      return "text-net-ground";
    case "power":
      return "text-net-power";
    case "signal":
      return "text-net-signal";
  }
}
