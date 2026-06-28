/**
 * Threat data orchestration for the Free tier.
 *
 * Pipeline:  CISA KEV (latest N)  →  NVD CVSS enrichment (best-effort)  →  rank → board rows.
 * Falls back to a bundled real snapshot if every live source is unreachable, so the board
 * is never empty. Server-only (uses fetch against external feeds); the client board reads
 * the result through /api/threats.
 */

import { fetchKev, SAMPLE_KEV, type KevEntry } from "./sources/cisaKev";
import { fetchCvssScores } from "./sources/nvd";
import { buildThreats, type Threat } from "./rank";

export type { Threat } from "./rank";

export type ThreatFeed = {
  threats: Threat[];
  source: string;
  live: boolean;
  fetchedAt: string;
};

export async function getThreats(limit = 12): Promise<ThreatFeed> {
  let entries: KevEntry[];
  let live = true;
  try {
    entries = await fetchKev(limit);
  } catch {
    entries = SAMPLE_KEV.slice(0, limit); // every mirror failed — serve the bundled snapshot
    live = false;
  }

  let scores: Record<string, number> = {};
  try {
    scores = await fetchCvssScores(entries.map((e) => e.cveID));
  } catch {
    scores = {}; // CVSS enrichment is optional; rank without it
  }

  return {
    threats: buildThreats(entries, scores),
    source: live ? "CISA KEV" : "CISA KEV (cached sample)",
    live,
    fetchedAt: new Date().toISOString(),
  };
}
