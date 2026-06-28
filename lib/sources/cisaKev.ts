/**
 * CISA KEV — Known Exploited Vulnerabilities catalog.
 *
 * Every entry in this catalog is, by definition, being actively exploited in the wild —
 * which is exactly the signal Pixqui ranks highest.
 *
 * Primary (canonical) source — CISA's own feed, no auth required:
 *   https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
 * Some networks (including this project's sandbox egress policy) block cisa.gov, so we
 * try the maintained GitHub mirror first and fall back to the canonical feed. If both are
 * unreachable, we serve SAMPLE_KEV (a recent real snapshot) so the board is never empty.
 */

export const KEV_URLS = [
  // GitHub mirror of the canonical catalog — reliably reachable.
  "https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json",
  // Canonical CISA feed (preferred when egress allows it).
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
];

export type KevEntry = {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string; // YYYY-MM-DD
  shortDescription: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string; // "Known" | "Unknown"
  notes?: string;
  /** Not part of the KEV feed — only present on bundled sample rows (CVSS comes from NVD live). */
  baseScore?: number | null;
};

type KevCatalog = {
  title?: string;
  catalogVersion?: string;
  dateReleased?: string;
  count?: number;
  vulnerabilities?: KevEntry[];
};

/** Pure: take a parsed catalog and return the most-recently-added N entries. */
export function parseKev(catalog: KevCatalog, limit = 12): KevEntry[] {
  const vulns = Array.isArray(catalog?.vulnerabilities) ? catalog.vulnerabilities : [];
  return vulns
    .filter((v) => v && typeof v.cveID === "string")
    .slice()
    .sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : a.dateAdded > b.dateAdded ? -1 : 0))
    .slice(0, limit);
}

/**
 * Fetch the live KEV catalog (latest N entries), trying each mirror in order.
 * Cached 4h to match the edition cadence. Throws only if every source fails.
 */
export async function fetchKev(limit = 12): Promise<KevEntry[]> {
  let lastErr: unknown;
  for (const url of KEV_URLS) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 14400 },
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        lastErr = new Error(`${url} responded ${res.status}`);
        continue;
      }
      const catalog = (await res.json()) as KevCatalog;
      const entries = parseKev(catalog, limit);
      if (entries.length) return entries;
      lastErr = new Error(`${url} returned no vulnerabilities`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All KEV sources failed");
}

/**
 * Offline fallback — a recent real snapshot of the CISA KEV catalog (2026-06 editions).
 * Used only when every live source is unreachable. `baseScore` values are approximate
 * stand-ins for the offline case; live deployments enrich CVSS from NVD instead.
 */
export const SAMPLE_KEV: KevEntry[] = [
  { cveID: "CVE-2026-20230", vendorProject: "Cisco", product: "Unified Communications Manager", vulnerabilityName: "Cisco Unified Communications Manager Server-Side Request Forgery (SSRF) Vulnerability", dateAdded: "2026-06-25", shortDescription: "Cisco Unified Communications Manager contains a server-side request forgery (SSRF) vulnerability that could allow an unauthenticated, remote attacker to write files to the underlying OS and later elevate to root.", knownRansomwareCampaignUse: "Unknown", baseScore: 9.8 },
  { cveID: "CVE-2026-12569", vendorProject: "PTC", product: "Windchill and FlexPLM", vulnerabilityName: "PTC Windchill and FlexPLM Improper Input Validation Vulnerability", dateAdded: "2026-06-25", shortDescription: "PTC Windchill and FlexPLM contains an improper input validation vulnerability allowing an unauthenticated, remote attacker to execute arbitrary code via a malicious request.", knownRansomwareCampaignUse: "Unknown", baseScore: 9.8 },
  { cveID: "CVE-2026-34908", vendorProject: "Ubiquiti", product: "UniFi OS", vulnerabilityName: "Ubiquiti UniFi OS Improper Access Control Vulnerability", dateAdded: "2026-06-23", shortDescription: "Ubiquiti UniFi OS contains an improper access control vulnerability which could allow a malicious actor with network access to make unauthorized changes to the system.", knownRansomwareCampaignUse: "Unknown", baseScore: 8.7 },
  { cveID: "CVE-2026-34910", vendorProject: "Ubiquiti", product: "UniFi OS", vulnerabilityName: "Ubiquiti UniFi OS Improper Input Validation Vulnerability", dateAdded: "2026-06-23", shortDescription: "Ubiquiti UniFi OS contains an improper input validation vulnerability which could allow a malicious actor with network access to conduct command injection.", knownRansomwareCampaignUse: "Unknown", baseScore: 9.0 },
  { cveID: "CVE-2025-67038", vendorProject: "Lantronix", product: "EDS5000", vulnerabilityName: "Lantronix EDS5000 Code Injection Vulnerability", dateAdded: "2026-06-23", shortDescription: "Lantronix EDS5000 contains a code injection vulnerability that could allow attackers to inject arbitrary OS commands into the username parameter.", knownRansomwareCampaignUse: "Unknown", baseScore: 9.8 },
  { cveID: "CVE-2026-20253", vendorProject: "Splunk", product: "Enterprise", vulnerabilityName: "Splunk Enterprise Missing Authentication for Critical Function Vulnerability", dateAdded: "2026-06-18", shortDescription: "Splunk Enterprise contains a missing authentication for critical function vulnerability which could allow an unauthenticated user to create or truncate arbitrary files.", knownRansomwareCampaignUse: "Unknown", baseScore: 8.6 },
  { cveID: "CVE-2026-48907", vendorProject: "Widget Factory", product: "Joomla Content Editor", vulnerabilityName: "Widget Factory Joomla Content Editor Improper Access Control Vulnerability", dateAdded: "2026-06-16", shortDescription: "Widget Factory Joomla Content Editor contains an improper access control vulnerability which could allow upload and execution of PHP code.", knownRansomwareCampaignUse: "Unknown", baseScore: 8.8 },
  { cveID: "CVE-2026-20262", vendorProject: "Cisco", product: "Catalyst SD-WAN Manager", vulnerabilityName: "Cisco Catalyst SD-WAN Manager Path Traversal Vulnerability", dateAdded: "2026-06-15", shortDescription: "Cisco Catalyst SD-WAN Manager contains a path traversal vulnerability that could allow an authenticated, remote attacker to overwrite files on the system.", knownRansomwareCampaignUse: "Unknown", baseScore: 7.2 },
  { cveID: "CVE-2026-54420", vendorProject: "LiteSpeed", product: "cPanel Plugin", vulnerabilityName: "LiteSpeed cPanel Plugin Symbolic Link Following Vulnerability", dateAdded: "2026-06-15", shortDescription: "LiteSpeed cPanel plugin contains a symlink-following vulnerability that could allow a user with FTP or web-shell access on a shared host to read or write protected files.", knownRansomwareCampaignUse: "Unknown", baseScore: 7.5 },
  { cveID: "CVE-2026-34909", vendorProject: "Ubiquiti", product: "UniFi OS", vulnerabilityName: "Ubiquiti UniFi OS Path Traversal Vulnerability", dateAdded: "2026-06-23", shortDescription: "Ubiquiti UniFi OS contains a path traversal vulnerability which could allow a malicious actor with network access to read files on the underlying system.", knownRansomwareCampaignUse: "Unknown", baseScore: 7.5 },
];
