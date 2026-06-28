/**
 * Offline check for the data pipeline: runs the pure parse + rank + map logic against a
 * local copy of the real CISA KEV feed and prints the resulting board rows.
 *   npx tsx scripts/preview-threats.ts <path-to-kev.json>
 */
import { readFileSync } from "node:fs";
import { parseKev } from "../lib/sources/cisaKev";
import { buildThreats } from "../lib/rank";

const path = process.argv[2];
if (!path) throw new Error("usage: tsx scripts/preview-threats.ts <kev.json>");

const catalog = JSON.parse(readFileSync(path, "utf8"));
const entries = parseKev(catalog, 12);
const rows = buildThreats(entries); // no NVD scores here (offline) -> CVSS shows as "-"

const counts: Record<string, number> = { ACT: 0, WATCH: 0, CALM: 0 };
for (const r of rows) counts[r.tier]++;

console.log(`parsed ${entries.length} entries\n`);
console.log("TIME    CODE             TIER   CVSS  SURFACE    MINE  STATUS      THREAT");
for (const r of rows) {
  console.log(
    [
      r.time.padEnd(7),
      r.code.padEnd(16),
      r.tier.padEnd(6),
      r.cvss.padEnd(5),
      r.surface.padEnd(10),
      (r.mine ? "yes" : "-").padEnd(5),
      r.status.padEnd(11),
      r.name,
    ].join(" "),
  );
}
console.log(`\ntier counts: ${counts.ACT} Act - ${counts.WATCH} Watch - ${counts.CALM} Calm`);
