"use client";

import * as React from "react";
import PixquiMark from "./PixquiMark";
import BoardWrapper from "./BoardWrapper";

// Free view is the raw wire — Act + Watch only. Calm ("good news") is an Assist perk.
const ACT_COUNT = 3;
const WATCH_COUNT = 5;
const SURFACED = ACT_COUNT + WATCH_COUNT;

const SOURCE_CARDS: { dot: string; kicker: string; kickerColor: string; title: string; body: string }[] = [
  {
    dot: "#BD4B2F", kicker: "Actively exploited", kickerColor: "#BD4B2F", title: "CISA KEV",
    body: "The US government's Known Exploited Vulnerabilities catalog — flaws that attackers are using right now, in real attacks. Pixqui gives this the highest priority.",
  },
  {
    dot: "#CE8A10", kicker: "Vulnerability data", kickerColor: "#CE8A10", title: "NVD — National Vulnerability Database",
    body: "The official US database of every disclosed security flaw. Pixqui filters to only entries modified in the last 4–12 hours, so you only see what's new.",
  },
  {
    dot: "#A07850", kicker: "Vendor patches", kickerColor: "#A07850", title: "Microsoft · Apple · Google · Android",
    body: "Direct from the makers of the software most people use every day — Windows, iPhone, Mac, Chrome, Android. When they ship a fix, Pixqui reads it.",
  },
  {
    dot: "#A07850", kicker: "Enterprise patches", kickerColor: "#A07850", title: "Cisco · VMware · Palo Alto · CrowdStrike",
    body: "Security advisories from the vendors whose products protect businesses and infrastructure. Important when flaws cascade to consumer devices.",
  },
  {
    dot: "#7C8B74", kicker: "Frontline journalism", kickerColor: "#6E7E62", title: "Krebs on Security · BleepingComputer · The Hacker News",
    body: "The three most trusted independent security news outlets. They break stories — active scam campaigns, real-world breach details, researcher discoveries — before any official advisory exists.",
  },
];

const PIPELINE: { step: string; body: string }[] = [
  { step: "Step 1 — Collect", body: "Pull the latest data from CISA KEV, NVD, vendor advisories, and security press — every 4 hours, on the dot." },
  { step: "Step 2 — Filter", body: "Diff against the previous edition. Only new or materially changed items advance — everything else stays quiet." },
  { step: "Step 3 — Rank & Translate", body: "Classify as Act, Watch, or Calm based on real-world exploitability and who it affects. Rewrite into plain English." },
];

const RANK_KEY: { label: string; color: string; bg: string; body: string }[] = [
  { label: "Act", color: "#BD4B2F", bg: "#F6E0D8", body: "Being actively exploited right now AND affects devices most people own — home routers, iPhones, Windows PCs, Chrome. Something you should do today." },
  { label: "Watch", color: "#CE8A10", bg: "#F8ECCF", body: "High severity but not yet confirmed exploited in the wild, or only affects a specific kind of setup. Worth knowing — act if it's relevant to you." },
  { label: "Calm", color: "#6E7E62", bg: "#E5E8DF", body: "Good news, patches already applied automatically, or very low real-world impact. Included because knowing is better than not knowing." },
];

const MONO = "'JetBrains Mono',monospace";

// Editions publish at these hours; the hero labels are derived from the real clock.
const EDITIONS = [6, 10, 14, 18, 22];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (h: number) => `${String(h).padStart(2, "0")}:00`;

type Edition = { editionLabel: string; nextLabel: string; sinceLabel: string };

// Static SSR fallback (matches the original copy) so hydration is stable; replaced on mount.
const EDITION_FALLBACK: Edition = {
  editionLabel: "14:00 edition",
  nextLabel: "Next 18:00",
  sinceLabel: "Today · since you last looked",
};

function computeEdition(now: Date | null): Edition {
  if (!now) return EDITION_FALLBACK;
  const h = now.getHours();

  const current = EDITIONS.filter((e) => e <= h).pop(); // most recent edition today
  const beforeFirst = current === undefined; // it's the small hours, before the 06:00 edition
  const curHour = beforeFirst ? 22 : current!;

  const next = EDITIONS.find((e) => e > h) ?? 6; // next edition (06:00 tomorrow if past 22:00)

  const idx = EDITIONS.indexOf(curHour);
  const prevHour = idx > 0 ? EDITIONS[idx - 1] : 22; // edition before the current one

  const editionDate = new Date(now);
  if (beforeFirst) editionDate.setDate(editionDate.getDate() - 1);

  return {
    editionLabel: `${hhmm(curHour)} edition`,
    nextLabel: `Next ${hhmm(next)}`,
    sinceLabel: `${DAYS[editionDate.getDay()]} · since you last looked at ${hhmm(prevHour)}`,
  };
}

export default function FreeEdition() {
  const [alertsRead, setAlertsRead] = React.useState(1240);
  const [edition, setEdition] = React.useState<Edition>(EDITION_FALLBACK);

  React.useEffect(() => {
    const t = setInterval(() => {
      setAlertsRead((s) => s + 1 + Math.floor(Math.random() * 3));
    }, 1400);
    return () => clearInterval(t);
  }, []);

  // Derive the edition/day labels from the real clock; refresh past edition boundaries.
  React.useEffect(() => {
    const tick = () => setEdition(computeEdition(new Date()));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  const headline = "Today's threats, ranked";
  const summaryLine = `${ACT_COUNT} to act on, ${WATCH_COUNT} worth a glance — the raw wire, ranked live. Want it calmer and personalized, with the noise removed? That's Pixqui Assist.`;

  return (
    <div style={{ background: "#F1F1F0", color: "#14110F", fontFamily: "'Hanken Grotesk',sans-serif", WebkitFontSmoothing: "antialiased", minHeight: "100vh", overflow: "hidden" }}>
      {/* ============ STICKY HEADER ============ */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(241,241,240,.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #E1DED7" }}>
        <div style={{ padding: "14px clamp(24px,5vw,80px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <PixquiMark size={28} />
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-.03em", color: "#14110F" }}>Pixqui</span>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", color: "#797977", border: "1px solid #DEDBD4", borderRadius: 999, padding: "2px 8px", marginLeft: 4 }}>FREE</span>
            <span style={{ width: 1, height: 15, background: "#DEDBD4", margin: "0 3px" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".03em", color: "#9b9a96" }}>Powered by Grok · xAI</span>
            <a
              href="/onboarding"
              title="Personalise your feed"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontFamily: MONO, fontSize: 11, letterSpacing: ".06em", color: "#CE8A10", border: "1px solid #F3E4C2", background: "#FFFBF2", borderRadius: 999, padding: "3px 10px", transition: "background .15s" }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="2.5" stroke="#CE8A10" strokeWidth="1.6" />
                <path d="M3 13 c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#CE8A10" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Personalise
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontSize: 12, color: "#797977" }}>
            <span suppressHydrationWarning>{edition.editionLabel}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: "#6B4F19" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C8B74", display: "inline-block" }} />
              <span suppressHydrationWarning>{edition.nextLabel}</span>
            </span>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{ padding: "clamp(48px,7vw,104px) clamp(24px,5vw,80px) clamp(40px,5vw,72px)", borderBottom: "1px solid #DEDBD4" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: "clamp(28px,4vw,46px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <PixquiMark size={44} />
            <span suppressHydrationWarning style={{ fontFamily: MONO, fontSize: 13, letterSpacing: ".16em", textTransform: "uppercase", color: "#6B4F19" }}>
              {edition.sinceLabel}
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(46px,8.6vw,118px)", lineHeight: 0.92, letterSpacing: "-.04em", fontWeight: 800, margin: 0, maxWidth: "13ch", textWrap: "balance" } as React.CSSProperties}>
          {headline}
        </h1>
        <p style={{ margin: "clamp(26px,3vw,40px) 0 0", fontSize: "clamp(18px,2.1vw,24px)", lineHeight: 1.5, color: "#44403B", maxWidth: 600 }}>{summaryLine}</p>

        {/* editorial stat row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "clamp(28px,5vw,72px)", flexWrap: "wrap", marginTop: "clamp(40px,5vw,64px)", paddingTop: "clamp(24px,3vw,38px)", borderTop: "1px solid #DEDBD4" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "clamp(36px,5vw,58px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
              {alertsRead.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7C8B74", display: "inline-block", animation: "relaySig 1.8s ease-in-out infinite" }} />
              <span style={{ fontFamily: MONO, fontSize: 12, color: "#797977", letterSpacing: ".04em" }}>alerts read · live</span>
            </div>
          </div>
          <svg width="34" height="18" viewBox="0 0 22 14" fill="none" style={{ flex: "none", marginBottom: 26 }}>
            <path d="M1 7 H 18 M 13 2 L 19 7 L 13 12" stroke="#CE8A10" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "clamp(36px,5vw,58px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1, color: "#CE8A10" }}>{SURFACED}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: "#797977", marginTop: 8, letterSpacing: ".04em" }}>worth showing</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 14, color: "#9b9a96", fontStyle: "italic", marginBottom: 6 }}>
            The rest is just noise — this is what matters to you.
          </span>
        </div>
      </section>

      {/* ============ GLOBAL LIVE BOARD (embedded) ============ */}
      <BoardWrapper context="free" mode="free" />

      {/* ============ 02 / WHERE THE SIGNAL COMES FROM ============ */}
      <section style={{ padding: "clamp(56px,8vw,112px) clamp(24px,5vw,80px)", borderTop: "1px solid #DEDBD4" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#6B4F19", marginBottom: 14 }}>
          02 / Where the signal comes from
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,480px),1fr))", gap: "clamp(40px,6vw,80px)", alignItems: "start", marginBottom: "clamp(48px,6vw,80px)" }}>
          <div>
            <h2 style={{ fontSize: "clamp(28px,3.8vw,48px)", lineHeight: 1.06, letterSpacing: "-.025em", fontWeight: 700, margin: "0 0 18px" }}>
              We read everything.<br />You only see what matters.
            </h2>
            <p style={{ margin: 0, fontSize: "clamp(15px,1.8vw,18px)", lineHeight: 1.7, color: "#44403B" }}>
              Every 4 hours, Pixqui reads from 11 trusted intelligence sources — government advisories, vendor patch feeds, and frontline security
              journalism. It compares the new edition against the last, strips out anything unchanged, and ranks what remains by real-world risk to
              everyday people.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PIPELINE.map((p) => (
              <div key={p.step} style={{ background: "#FEFCF8", border: "1px solid #E4E0D8", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: "#CE8A10", marginTop: 7 }} />
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#6B4F19", marginBottom: 5 }}>{p.step}</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "#44403B" }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* sources grid */}
        <div style={{ borderTop: "1px solid #DEDBD4", paddingTop: "clamp(36px,4vw,56px)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#9b9a96", marginBottom: 24 }}>
            The 11 sources we read every edition
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 14 }}>
            {SOURCE_CARDS.map((s) => (
              <div key={s.title} style={{ background: "#fff", border: "1px solid #EBE8E1", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px -4px rgba(20,17,15,.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flex: "none" }} />
                  <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: s.kickerColor }}>{s.kicker}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#14110F", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#797977" }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ranking key */}
        <div style={{ marginTop: "clamp(36px,4vw,56px)", borderTop: "1px solid #DEDBD4", paddingTop: "clamp(36px,4vw,56px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "clamp(20px,3vw,36px)", alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#797977", marginBottom: 20 }}>How we rank what you see</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {RANK_KEY.map((k, i) => (
                <div key={k.label} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 0", borderBottom: i < RANK_KEY.length - 1 ? "1px solid #E7E4DD" : "none" }}>
                  <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: k.color, padding: "3px 10px", borderRadius: 999, background: k.bg, marginTop: 2 }}>
                    {k.label}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: 1.6, color: "#2C2924" }}>{k.body}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#14110F", color: "#F1F1F0", borderRadius: 18, padding: "clamp(24px,3vw,34px)", boxShadow: "0 24px 50px -28px rgba(20,17,15,.5)" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#F6AD2E", marginBottom: 16 }}>The 4-hour cadence</div>
            <div style={{ fontSize: "clamp(38px,4.5vw,54px)", fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1, color: "#F6AD2E" }}>Every 4h</div>
            <p style={{ margin: "18px 0 0", fontSize: 15.5, lineHeight: 1.65, color: "#CFCBC4" }}>
              Editions publish at <strong style={{ color: "#F1F1F0", fontWeight: 600 }}>06:00 · 10:00 · 14:00 · 18:00 · 22:00</strong>. Each one is diffed against the
              last — only what&apos;s new or materially changed surfaces. A fresh exploit, a patch that just dropped, a campaign now confirmed. Everything
              else stays quiet so you can.
            </p>
          </div>
        </div>
      </section>

      {/* ============ SIGN-OFF FOOTER ============ */}
      <section style={{ padding: "clamp(56px,8vw,120px) clamp(24px,5vw,80px) 72px", borderTop: "1px solid #DEDBD4" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <PixquiMark size={40} />
          <span style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 800, letterSpacing: "-.04em", color: "#14110F" }}>Pixqui</span>
        </div>
        <p style={{ margin: 0, maxWidth: 620, fontSize: "clamp(18px,2.4vw,28px)", lineHeight: 1.4, fontWeight: 500, letterSpacing: "-.01em" }}>
          That&apos;s your edition. No homework, no doomscroll — Pixqui&apos;s reading the noise so you don&apos;t have to.
        </p>
        <p style={{ margin: "18px 0 0", fontFamily: MONO, fontSize: "clamp(12px,1.3vw,14px)", letterSpacing: ".12em", textTransform: "uppercase", color: "#6B4F19" }}>
          Cyber Intelligence Powered by Grok AI
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginTop: 56, borderTop: "1px solid #DEDBD4", paddingTop: 24, fontFamily: MONO, fontSize: 12, color: "#797977" }}>
          <span>Pixqui — Watches so you can move</span>
          <span>Editions powered by Grok · xAI</span>
          <span>Calm · Watch · Act</span>
        </div>
      </section>
    </div>
  );
}
