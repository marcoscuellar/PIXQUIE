/**
 * NVD — National Vulnerability Database (CVSS enrichment).
 *
 * The KEV feed has no CVSS scores, so we look them up from NVD. This is best-effort:
 * NVD is rate-limited (5 req / 30s anonymous, 50 with a key) and may be blocked on some
 * networks. Any CVE we can't resolve simply stays at "—" and is ranked without a score.
 *
 * Set NVD_API_KEY to raise the rate limit; set ENABLE_NVD=0 to skip enrichment entirely.
 */

const NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

type NvdResponse = {
  vulnerabilities?: Array<{
    cve?: {
      metrics?: {
        cvssMetricV31?: Array<{ cvssData?: { baseScore?: number } }>;
        cvssMetricV30?: Array<{ cvssData?: { baseScore?: number } }>;
        cvssMetricV2?: Array<{ cvssData?: { baseScore?: number } }>;
      };
    };
  }>;
};

function scoreFrom(json: NvdResponse): number | null {
  const m = json?.vulnerabilities?.[0]?.cve?.metrics ?? {};
  const s =
    m.cvssMetricV31?.[0]?.cvssData?.baseScore ??
    m.cvssMetricV30?.[0]?.cvssData?.baseScore ??
    m.cvssMetricV2?.[0]?.cvssData?.baseScore;
  return typeof s === "number" ? s : null;
}

async function fetchOne(cveId: string, apiKey?: string): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${NVD_URL}?cveId=${encodeURIComponent(cveId)}`, {
      headers: apiKey ? { apiKey } : undefined,
      next: { revalidate: 14400 },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return scoreFrom((await res.json()) as NvdResponse);
  } catch {
    return null; // timeout, network block, or rate limit — degrade gracefully
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve CVSS base scores for a list of CVE IDs. Returns a partial map; missing = unresolved. */
export async function fetchCvssScores(cveIds: string[]): Promise<Record<string, number>> {
  if (process.env.ENABLE_NVD === "0") return {};
  const apiKey = process.env.NVD_API_KEY;
  const out: Record<string, number> = {};
  const queue = [...cveIds];

  async function worker() {
    let id: string | undefined;
    while ((id = queue.shift())) {
      const score = await fetchOne(id, apiKey);
      if (score != null) out[id] = score;
    }
  }

  // Modest concurrency to stay friendly to the rate limit.
  const lanes = Math.min(apiKey ? 5 : 2, cveIds.length);
  await Promise.all(Array.from({ length: lanes }, () => worker()));
  return out;
}
