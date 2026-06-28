/**
 * Ranking + mapping: turn a raw KEV entry (+ optional CVSS) into a board row.
 *
 * Tiering rules (everything in KEV is already "actively exploited"):
 *   ACT   — ransomware-linked, OR critical severity (CVSS ≥ 9), OR added in the last 7 days
 *           with no score yet (fresh + exploited = deal with it today).
 *   WATCH — high severity (CVSS ≥ 7), or exploited with an unknown score.
 *   CALM  — lower severity (CVSS < 7); exploited but lower real-world urgency.
 */

import type { KevEntry } from "./sources/cisaKev";

export type Tier = "ACT" | "WATCH" | "CALM";
export type Trend = "up" | "down" | "flat";

export type Threat = {
  time: string;
  code: string;
  name: string;
  surface: string;
  cvss: string;
  tier: Tier;
  status: string;
  trend: Trend;
  mine: boolean;
  note?: string;
};

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function rankTier(cvss: number | null, ransomware: boolean, dateAdded: string, now = Date.now()): Tier {
  const added = Date.parse(dateAdded);
  const recent = Number.isFinite(added) && now - added <= 7 * DAY;
  if (ransomware || (cvss != null && cvss >= 9.0) || (cvss == null && recent)) return "ACT";
  if (cvss == null || cvss >= 7.0) return "WATCH";
  return "CALM";
}

/**
 * A short, friendly "surface" tag for the SURFACE column, inferred from vendor/product.
 *
 * Short, ambiguous tokens (ios, edge, sms, iot, plc, asus, …) are matched as whole words
 * via \b so they don't trip on substrings — e.g. "ios" must not match BIOS/various,
 * "edge" must not match knowledge, "iot" must not match patriot, "unifi" must not match
 * Unified. Longer/unique tokens (chromium, microsoft, lantronix, …) match directly.
 */
export function surfaceOf(vendor: string, product: string): string {
  const v = vendor.toLowerCase();
  const p = `${vendor} ${product}`.toLowerCase();
  if (/(\brouter\b|\bunifi\b|ubiquiti|edgerouter|edgeos|netgear|tp-link|d-link|linksys|\basus\b|\beero\b)/.test(p)) return "HOME NET";
  if (/(chrome|chromium|firefox|webkit|safari|\bedge\b|\bbrowser\b)/.test(p)) return "BROWSER";
  // "ios" is shared by Apple iOS and Cisco IOS — only treat as Apple-surface when the
  // vendor is Apple (or the product is an unambiguous Apple platform).
  if (/\bapple\b/.test(v) || /(iphone|ipad|ipados|macos|watchos)/.test(p)) return "APPLE";
  if (/(android|\bpixel\b)/.test(p)) return "MOBILE";
  if (/(windows|microsoft|sharepoint|office|outlook|exchange|\.net\b)/.test(p)) return "WINDOWS";
  if (/(\bsms\b|smish|messaging|whatsapp)/.test(p)) return "PHONE";
  if (/(\bserver\b|linux|vmware|splunk|cpanel|litespeed|joomla|wordpress|apache|cisco|fortinet|ivanti|citrix)/.test(p))
    return "SERVER";
  if (/(\biot\b|camera|\bnvr\b|scada|\bplc\b|lantronix)/.test(p)) return "IOT";
  return vendor.replace(/\s+/g, " ").trim().toUpperCase().slice(0, 9) || "GENERAL";
}

/** Whether an entry is likely relevant to an everyday consumer (drives the AI Assist filter). */
export function isConsumerRelevant(vendor: string, product: string): boolean {
  const p = `${vendor} ${product}`.toLowerCase();
  // \bunifi\b avoids matching "Unified"; \brouter\b avoids matching inside larger words.
  return /(microsoft|windows|office|outlook|apple|ios|iphone|ipad|macos|safari|google|chrome|chromium|android|pixel|adobe|acrobat|mozilla|firefox|zoom|whatsapp|samsung|netgear|tp-link|tp link|d-link|d link|linksys|\basus\b|ubiquiti|\bunifi\b|\brouter\b)/.test(
    p,
  );
}

function fmtDate(dateAdded: string): string {
  const d = new Date(`${dateAdded}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateAdded;
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
}

function cleanName(name: string): string {
  const n = name.replace(/\s+Vulnerability$/i, "").trim();
  return n.length > 64 ? `${n.slice(0, 61).trimEnd()}…` : n;
}

function shortProduct(product: string): string {
  const p = product.trim();
  return p.length > 26 ? `${p.slice(0, 24).trimEnd()}…` : p;
}

/** Pure: map one KEV entry (+ resolved CVSS) into a board row. */
export function toThreat(entry: KevEntry, cvss: number | null, now = Date.now()): Threat {
  const ransomware = (entry.knownRansomwareCampaignUse || "").toLowerCase() === "known";
  const tier = rankTier(cvss, ransomware, entry.dateAdded, now);
  const mine = isConsumerRelevant(entry.vendorProject, entry.product);
  return {
    time: fmtDate(entry.dateAdded),
    code: entry.cveID,
    name: cleanName(entry.vulnerabilityName),
    surface: surfaceOf(entry.vendorProject, entry.product),
    cvss: cvss != null ? cvss.toFixed(1) : "—",
    tier,
    // Every KEV entry is exploited by definition; ransomware-linked ones spread fastest.
    status: ransomware ? "SPREADING" : "EXPLOITED",
    trend: tier === "ACT" ? "up" : tier === "CALM" ? "down" : "flat",
    mine,
    note: mine ? `Affects ${shortProduct(entry.product)}.` : undefined,
  };
}

/** Pure: map a list of entries, preferring NVD scores then any bundled baseScore. */
export function buildThreats(
  entries: KevEntry[],
  scores: Record<string, number> = {},
  now = Date.now(),
): Threat[] {
  return entries.map((e) => toThreat(e, scores[e.cveID] ?? e.baseScore ?? null, now));
}
