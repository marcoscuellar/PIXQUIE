"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import PixquiMark from "./PixquiMark";

export type BoardTheme = "dark" | "mono" | "light";
export type BoardMode = "free" | "assist";

type Props = {
  /** Embedded inside a wrapper — hides the theme toggle and forces the given theme. */
  embed?: boolean;
  theme?: BoardTheme;
  mode?: BoardMode;
  /**
   * Gate the Assist view behind sign-up. When locked (the default for free boards), the
   * second segment is a "SIGN UP" CTA that routes to sign-up instead of toggling Assist on.
   * Pass `false` for an authenticated Assist context to restore the real toggle.
   */
  lockAssist?: boolean;
};

type Trend = "up" | "down" | "flat";
type Tier = "ACT" | "WATCH" | "CALM";

type Datum = {
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

// Fallback used for the initial render and if the live feed is unavailable. Replaced at
// runtime by real CISA KEV data fetched from /api/threats.
const FALLBACK: Datum[] = [
  { time: "14:02", code: "CVE-2026-2741", name: "Home-router remote takeover", surface: "HOME NET", cvss: "9.8", tier: "ACT", status: "EXPLOITED", trend: "up", mine: true, note: "Your home Wi-Fi runs through this router." },
  { time: "13:58", code: "SMISH-0934", name: "Courier delivery text scam", surface: "SMS", cvss: "6.4", tier: "WATCH", status: "SPREADING", trend: "up", mine: true, note: "You get parcel updates by text." },
  { time: "13:51", code: "CVE-2026-1180", name: "Chrome V8 type-confusion", surface: "BROWSER", cvss: "8.1", tier: "WATCH", status: "PATCH OUT", trend: "flat", mine: true, note: "You browse on Chrome daily." },
  { time: "13:49", code: "APPLE-19.3", name: "iOS security update shipped", surface: "MOBILE", cvss: "7.5", tier: "CALM", status: "PATCHED", trend: "down", mine: false },
  { time: "13:44", code: "LEAK-77M", name: "Credential dump circulating", surface: "ACCOUNTS", cvss: "7.2", tier: "WATCH", status: "EXPOSED", trend: "up", mine: true, note: "Your email appears in the dump." },
  { time: "13:40", code: "CVE-2026-0455", name: "Windows kernel privilege esc", surface: "DESKTOP", cvss: "8.8", tier: "ACT", status: "EXPLOITED", trend: "up", mine: false },
  { time: "13:36", code: "FIDO-PASSKEY", name: "Bank rolls out passkeys", surface: "ACCOUNTS", cvss: "—", tier: "CALM", status: "GOOD NEWS", trend: "down", mine: false },
  { time: "13:31", code: "WA-E2E", name: "WhatsApp backups encrypted", surface: "MESSAGING", cvss: "—", tier: "CALM", status: "GOOD NEWS", trend: "down", mine: false },
  { time: "13:27", code: "VISH-2210", name: "Bank vishing call wave", surface: "PHONE", cvss: "5.9", tier: "WATCH", status: "SPREADING", trend: "up", mine: false },
  { time: "13:20", code: "AUDIT-PASS", name: "Password manager cleared audit", surface: "APPS", cvss: "—", tier: "CALM", status: "CLEARED", trend: "flat", mine: false },
  { time: "13:14", code: "EVIL-TWIN", name: "Airport Wi-Fi spoof active", surface: "WIFI", cvss: "6.8", tier: "WATCH", status: "ACTIVE", trend: "up", mine: false },
  { time: "13:09", code: "EXT-HIJACK", name: "Browser extension turned bad", surface: "BROWSER", cvss: "9.1", tier: "ACT", status: "EXPLOITED", trend: "up", mine: false },
];

const WIDE_GRID = "62px 150px 1fr 110px 56px 92px 116px 44px";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function ThreatBoard({ embed = false, theme: themeProp = "dark", mode: modeProp = "free", lockAssist }: Props) {
  const router = useRouter();
  // Free boards lock Assist behind sign-up; an explicit assist board does not.
  const locked = lockAssist ?? modeProp !== "assist";
  const [mode, setMode] = React.useState<BoardMode>(modeProp === "assist" ? "assist" : "free");
  const [themeState, setThemeState] = React.useState<BoardTheme>(themeProp === "light" ? "light" : themeProp);
  const [now, setNow] = React.useState<Date | null>(null);
  const [scanned, setScanned] = React.useState(1247);
  const [cw, setCw] = React.useState(1280);
  const [data, setData] = React.useState<Datum[]>(FALLBACK);
  const [source, setSource] = React.useState("CISA KEV");
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Pull live CISA KEV data (ranked Act/Watch/Calm) from the API; keep the fallback on error.
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/threats")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((feed) => {
        const incoming: unknown = feed?.threats;
        const rows = Array.isArray(incoming)
          ? (incoming as Datum[]).filter(
              (d) => d && typeof d.code === "string" && (d.tier === "ACT" || d.tier === "WATCH" || d.tier === "CALM"),
            )
          : [];
        if (!cancelled && rows.length) {
          setData(rows);
          if (typeof feed?.source === "string") setSource(feed.source);
        }
      })
      .catch(() => {
        /* offline / blocked — keep the bundled fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => {
      setNow(new Date());
      setScanned((s) => s + Math.floor(Math.random() * 3));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setCw(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect ? entries[0].contentRect.width : el.clientWidth;
      if (w && Math.abs(w - cw) > 2) setCw(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assist = mode === "assist";
  const theme: BoardTheme = embed ? themeProp || "dark" : themeState;
  const mono = theme === "mono";
  const dark = theme === "dark";
  const narrow = cw < 720;
  const wide = !narrow;

  const P = dark
    ? {
        bg: "#0E0C0B", headerBg: "#14110F", border: "#211E1A", brand: "#F1F1F0", muted: "#7d766c",
        status: "#A39C92", clock: "#E8B923", toggleTrack: "#0E0C0B", toggleBorder: "#2C2924",
        tickerBg: "#100E0D", tickerStrong: "#ffffff", title: "#F1F1F0",
        panel: "#14110F", colHeadBg: "#100E0D", colHeadText: "#6f685f",
        rowBorder: "#1A1714", rowName: "#F1F1F0", rowDim: "#6f685f", rowCode: "#C6BFB4", rowSurface: "#8a847a", rowCvss: "#C6BFB4",
        clearedBg: "#100E0D", clearedText: "#9b958c", idxLabel: "#6f685f", idxSub: "#7d766c", accentText: "#E8B923",
      }
    : mono
    ? {
        bg: "#FFFFFF", headerBg: "#FFFFFF", border: "#ECECEC", brand: "#0A0A0A", muted: "#9A9A9A",
        status: "#555555", clock: "#0A0A0A", toggleTrack: "#FFFFFF", toggleBorder: "#E4E4E4",
        tickerBg: "#FAFAFA", tickerStrong: "#0A0A0A", title: "#0A0A0A",
        panel: "#FFFFFF", colHeadBg: "#FAFAFA", colHeadText: "#9A9A9A",
        rowBorder: "#F1F1F1", rowName: "#0A0A0A", rowDim: "#B4B4B4", rowCode: "#555555", rowSurface: "#8A8A8A", rowCvss: "#333333",
        clearedBg: "#FAFAFA", clearedText: "#777777", idxLabel: "#9A9A9A", idxSub: "#9A9A9A", accentText: "#0A0A0A",
      }
    : {
        bg: "#ECEAE4", headerBg: "#F7F5F0", border: "#E4E0D8", brand: "#14110F", muted: "#8a847a",
        status: "#6f685f", clock: "#B8791A", toggleTrack: "#ECEAE4", toggleBorder: "#E0DBCE",
        tickerBg: "#F2F0EA", tickerStrong: "#14110F", title: "#14110F",
        panel: "#FFFFFF", colHeadBg: "#F4F2EC", colHeadText: "#8a847a",
        rowBorder: "#EFEDE7", rowName: "#14110F", rowDim: "#9b9a96", rowCode: "#57534c", rowSurface: "#8a847a", rowCvss: "#57534c",
        clearedBg: "#F4F2EC", clearedText: "#6f685f", idxLabel: "#8a847a", idxSub: "#8a847a", accentText: "#B8791A",
      };

  const C = dark
    ? { red: "#CF5A3C", amber: "#E8B923", green: "#7C8B74" }
    : { red: "#BD4B2F", amber: "#B8791A", green: "#5E6B56" };

  const tier: Record<Tier, { tierBg: string; tierFg: string }> = dark
    ? {
        ACT: { tierBg: "rgba(207,90,60,.16)", tierFg: "#E8856B" },
        WATCH: { tierBg: "rgba(232,185,35,.15)", tierFg: "#E8B923" },
        CALM: { tierBg: "rgba(124,139,116,.16)", tierFg: "#9BB08C" },
      }
    : {
        ACT: { tierBg: "rgba(189,75,47,.12)", tierFg: "#BD4B2F" },
        WATCH: { tierBg: "rgba(184,121,26,.14)", tierFg: "#B8791A" },
        CALM: { tierBg: "rgba(94,107,86,.14)", tierFg: "#5E6B56" },
      };

  const statusColor: Record<string, string> = {
    EXPLOITED: C.red, SPREADING: C.amber, "PATCH OUT": C.amber, EXPOSED: C.amber, ACTIVE: C.amber,
    PATCHED: C.green, "GOOD NEWS": C.green, CLEARED: C.green,
  };
  const trendOf = (t: Trend) =>
    t === "up" ? { trend: "▲", trendColor: C.red } : t === "down" ? { trend: "▼", trendColor: C.green } : { trend: "▬", trendColor: P.muted };

  // Free tier is the raw wire: Act + Watch only. Calm ("good news" / reassurance) is an
  // Assist perk, so it's dropped from the default free view. Assist filters to "mine".
  const visible = assist ? data.filter((d) => d.mine) : data.filter((d) => d.tier !== "CALM");
  const rows = visible.map((d) => ({
    time: d.time, code: d.code, name: d.name, surface: d.surface, cvss: d.cvss,
    tier: d.tier, ...tier[d.tier], status: d.status, statusColor: statusColor[d.status] || P.muted, ...trendOf(d.trend),
    rowBg: assist && d.mine ? (dark ? "rgba(232,185,35,.04)" : mono ? "#F5F5F5" : "rgba(184,121,26,.05)") : "transparent",
    mineNote: assist && d.mine, note: d.note || "",
  }));

  const arrowOf = (t: Trend) => (t === "up" ? "▲" : t === "down" ? "▼" : "▬");
  const colorOf = (d: Datum) => (d.tier === "ACT" ? C.red : d.tier === "CALM" ? C.green : C.amber);
  const tItems = data.slice(0, 9).map((d) => ({
    arrow: arrowOf(d.trend), code: d.code, tag: d.surface.replace(" ", "-"), cvss: d.cvss, status: d.status.replace(" ", "-"), color: colorOf(d),
  }));
  const tickerLoop = [...tItems, ...tItems];

  const clearedCount = data.length - visible.length;
  const actCount = data.filter((d) => d.tier === "ACT").length;
  const watchCount = data.filter((d) => d.tier === "WATCH").length;
  const myAct = data.filter((d) => d.mine && d.tier === "ACT").length;
  const myWatch = data.filter((d) => d.mine && d.tier === "WATCH").length;

  const clock = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : "--:--:--";

  const indices = assist
    ? [
        { label: "YOUR EXPOSURE", value: String(visible.length), delta: "needs you", color: P.clock, deltaColor: P.muted, sub: `${myAct} Act · ${myWatch} Watch for your setup` },
        { label: "ACT NOW", value: String(myAct), delta: "▲", color: C.red, deltaColor: C.red, sub: "Exploited & affects you" },
        { label: "CLEARED FOR YOU", value: String(clearedCount), delta: "removed", color: C.green, deltaColor: C.green, sub: "Don't affect your devices" },
        { label: "SCANNED TODAY", value: scanned.toLocaleString(), delta: "live", color: P.brand, deltaColor: P.muted, sub: "Signals read by Pixqui Assist" },
      ]
    : [
        { label: "THREAT INDEX", value: String(visible.length), delta: "on board", color: P.brand, deltaColor: P.muted, sub: "Act & Watch this edition" },
        { label: "EXPLOITED NOW", value: String(actCount), delta: "▲", color: C.red, deltaColor: C.red, sub: "Act tier · active attacks" },
        { label: "WATCHING", value: String(watchCount), delta: "▬", color: C.amber, deltaColor: C.amber, sub: "High severity, not yet at you" },
        { label: "SCANNED TODAY", value: scanned.toLocaleString(), delta: "live", color: P.brand, deltaColor: P.muted, sub: "Global signals read" },
      ];

  const segActive: React.CSSProperties = { background: "#E8B923", color: "#14110F" };
  const segIdle: React.CSSProperties = { background: "transparent", color: P.muted };
  const segBase: React.CSSProperties = {
    cursor: "pointer", border: "none", fontFamily: "inherit", borderRadius: 8, padding: "8px 13px",
    fontSize: 11, fontWeight: 600, letterSpacing: ".04em",
  };
  const modeSegBase: React.CSSProperties = { ...segBase, padding: "8px 14px" };

  const showCleared = assist && clearedCount > 0;

  return (
    <div
      ref={rootRef}
      style={{
        background: P.bg, color: P.brand, fontFamily: "'JetBrains Mono',monospace",
        WebkitFontSmoothing: "antialiased", padding: "0 0 40px",
      }}
    >
      {/* ============ TOP STATUS BAR ============ */}
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
          padding: "16px clamp(18px,3vw,40px)", borderBottom: `1px solid ${P.border}`, background: P.headerBg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <PixquiMark size={42} stroke={P.brand} outerWidth={2.6} innerWidth={1.9} innerOpacity={1} center={P.headerBg} />
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: "-.035em" }}>Pixqui</span>
          <span style={{ fontSize: 11, letterSpacing: ".18em", color: P.muted, borderLeft: `1px solid ${P.border}`, paddingLeft: 13 }}>
            LIVE GLOBAL THREAT BOARD
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, letterSpacing: ".08em", color: P.status }}>
          <span style={{ color: P.clock, fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>{clock}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {!embed && (
            <div style={{ display: "inline-flex", background: P.toggleTrack, border: `1px solid ${P.toggleBorder}`, borderRadius: 11, padding: 3, gap: 2 }}>
              <button onClick={() => setThemeState("dark")} style={{ ...segBase, ...(theme === "dark" ? segActive : segIdle) }}>DARK</button>
              <button onClick={() => setThemeState("mono")} style={{ ...segBase, ...(theme === "mono" ? segActive : segIdle) }}>MONO</button>
              <button onClick={() => setThemeState("light")} style={{ ...segBase, ...(theme === "light" ? segActive : segIdle) }}>LIGHT</button>
            </div>
          )}
          <div style={{ display: "inline-flex", background: P.toggleTrack, border: `1px solid ${P.toggleBorder}`, borderRadius: 11, padding: 3, gap: 2 }}>
            <button onClick={() => setMode("free")} style={{ ...modeSegBase, ...(assist ? segIdle : segActive) }}>FREE</button>
            {locked ? (
              // Assist is a paid upgrade — don't preview it; send free users to sign up.
              <button
                onClick={() => router.push("/onboarding")}
                title="Sign up to unlock Pixqui Assist"
                style={{ ...modeSegBase, ...segIdle }}
              >
                SIGN UP
              </button>
            ) : (
              <button onClick={() => setMode("assist")} style={{ ...modeSegBase, ...(assist ? segActive : segIdle) }}>AI ASSIST</button>
            )}
          </div>
        </div>
      </header>

      {/* ============ TICKER TAPE ============ */}
      <div style={{ overflow: "hidden", borderBottom: `1px solid ${P.border}`, background: P.tickerBg, padding: "9px 0" }}>
        <div style={{ display: "flex", width: "max-content", animation: "tickerScroll 38s linear infinite", willChange: "transform" }}>
          {tickerLoop.map((t, i) => (
            <span key={i} style={{ padding: "0 15px", fontSize: 12, letterSpacing: ".04em", color: t.color, whiteSpace: "nowrap" }}>
              {t.arrow} {t.code} {t.tag} <b style={{ color: P.tickerStrong }}>{t.cvss}</b> {t.status}
            </span>
          ))}
        </div>
      </div>

      {/* ============ MAIN ============ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, padding: "0 clamp(18px,3vw,40px)" }}>
        <section style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden" }}>
          {wide && (
            <div
              style={{
                display: "grid", gridTemplateColumns: WIDE_GRID, gap: 12, padding: "13px 18px",
                borderBottom: `1px solid ${P.border}`, fontSize: 10, letterSpacing: ".14em", color: P.colHeadText, background: P.colHeadBg,
              }}
            >
              <span>TIME</span><span>CODE</span><span>THREAT</span><span>SURFACE</span><span>CVSS</span><span>TIER</span><span>STATUS</span>
              <span style={{ textAlign: "right" }}>±</span>
            </div>
          )}

          <div>
            {wide &&
              rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid", gridTemplateColumns: WIDE_GRID, gap: 12, padding: "14px 18px",
                    borderBottom: `1px solid ${P.rowBorder}`, alignItems: "center", fontSize: 13, background: r.rowBg, animation: "rowIn .3s ease-out",
                  }}
                >
                  <span style={{ color: P.rowDim, fontSize: 12 }}>{r.time}</span>
                  <span style={{ color: P.rowCode, letterSpacing: ".02em" }}>{r.code}</span>
                  <span style={{ color: P.rowName }}>
                    {r.name}
                    {r.mineNote && (
                      <span style={{ display: "block", color: P.accentText, fontSize: 11, marginTop: 3 }}>▸ {r.note}</span>
                    )}
                  </span>
                  <span style={{ color: P.rowSurface, fontSize: 11, letterSpacing: ".04em" }}>{r.surface}</span>
                  <span style={{ color: P.rowCvss, fontVariantNumeric: "tabular-nums" }}>{r.cvss}</span>
                  <span>
                    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", background: r.tierBg, color: r.tierFg }}>
                      {r.tier}
                    </span>
                  </span>
                  <span style={{ color: r.statusColor, fontSize: 11, letterSpacing: ".04em" }}>{r.status}</span>
                  <span style={{ textAlign: "right", color: r.trendColor, fontSize: 14 }}>{r.trend}</span>
                </div>
              ))}

            {narrow &&
              rows.map((r, i) => (
                <div key={i} style={{ padding: "15px 16px", borderBottom: `1px solid ${P.rowBorder}`, background: r.rowBg, animation: "rowIn .3s ease-out" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: P.rowName, fontSize: 14, lineHeight: 1.3, fontWeight: 500 }}>{r.name}</div>
                      <div style={{ color: P.rowCode, fontSize: 11, letterSpacing: ".02em", marginTop: 4 }}>{r.code} · {r.surface}</div>
                    </div>
                    <span style={{ flex: "none", display: "inline-block", padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", background: r.tierBg, color: r.tierFg }}>
                      {r.tier}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 11, fontSize: 11, letterSpacing: ".04em" }}>
                    <span style={{ color: P.rowDim }}>{r.time}</span>
                    <span style={{ color: P.rowCvss, fontVariantNumeric: "tabular-nums" }}>CVSS {r.cvss}</span>
                    <span style={{ color: r.statusColor }}>{r.status}</span>
                    <span style={{ marginLeft: "auto", color: r.trendColor, fontSize: 14 }}>{r.trend}</span>
                  </div>
                  {r.mineNote && <div style={{ color: P.accentText, fontSize: 11, marginTop: 9 }}>▸ {r.note}</div>}
                </div>
              ))}

            {showCleared && (
              <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 11, background: P.clearedBg, borderBottom: `1px solid ${P.rowBorder}` }}>
                <svg width="14" height="14" viewBox="0 0 52 52" fill="none">
                  <path d="M44.3 14.1 A21.8 21.8 0 1 1 37.9 7.7" stroke="#E8B923" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                  <circle cx="26" cy="26" r="7" fill="#E8B923" />
                </svg>
                <span style={{ fontSize: 12, color: P.clearedText, letterSpacing: ".03em" }}>
                  Pixqui Assist cleared <b style={{ color: P.rowName }}>{clearedCount}</b> threats that don&apos;t affect you — handled, patched, or irrelevant to your setup.
                </span>
              </div>
            )}
          </div>
        </section>

        <aside style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 12 }}>
          {indices.map((ix, i) => (
            <div key={i} style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: P.idxLabel, marginBottom: 12 }}>{ix.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.02em", color: ix.color, fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
                  {ix.value}
                </span>
                <span style={{ fontSize: 12, color: ix.deltaColor }}>{ix.delta}</span>
              </div>
              <div style={{ fontSize: 11, color: P.idxSub, marginTop: 8 }}>{ix.sub}</div>
            </div>
          ))}
        </aside>
      </div>

      {/* ============ BRANDED FOOTER ============ */}
      <footer
        style={{
          margin: "30px clamp(18px,3vw,40px) 0", paddingTop: 22, borderTop: `1px solid ${P.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <PixquiMark size={22} stroke={P.brand} outerWidth={2.6} innerWidth={1.9} innerOpacity={1} center={P.headerBg} />
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "-.02em", color: P.brand }}>Pixqui</span>
          <span style={{ fontSize: 11, letterSpacing: ".04em", color: P.muted, borderLeft: `1px solid ${P.border}`, paddingLeft: 11 }}>
            Brought to you by Pixqui · Watches so you can move
          </span>
        </div>
        <span style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: P.muted }}>
          Cyber Intelligence Powered by Grok · xAI
        </span>
      </footer>

      {/* data provenance */}
      <div style={{ margin: "12px clamp(18px,3vw,40px) 0", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: P.clock, display: "inline-block" }} />
        <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: P.muted }}>
          Data source: {source} · CVSS via NVD
        </span>
      </div>
    </div>
  );
}
