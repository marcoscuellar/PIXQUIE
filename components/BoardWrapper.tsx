import * as React from "react";
import ThreatBoard, { BoardMode, BoardTheme } from "./ThreatBoard";

type Context = "free" | "marketing" | "assist";

type Props = {
  context?: Context;
  theme?: BoardTheme;
  mode?: BoardMode;
};

/**
 * OUTER WRAPPER — wraps the Actual Board with context-specific padding and copy.
 * `marketing` gets a full editorial dark intro with the board flush below;
 * `free` / `assist` get the lean in-page treatment in a rounded bordered container.
 */
export default function BoardWrapper({ context = "free", theme, mode }: Props) {
  const boardMode: BoardMode = mode || (context === "assist" ? "assist" : "free");
  const boardTheme: BoardTheme = theme || (context === "assist" ? "mono" : "dark");

  const upsellMap: Record<"free" | "assist", { upsellText: string; ctaLabel: string; ctaPrice: string; showUpsell: boolean }> = {
    free: { upsellText: "Tired of scanning the whole wire? Assist keeps only the threats that reach you.", ctaLabel: "Try Pixqui Assist", ctaPrice: "$4/mo", showUpsell: true },
    assist: { upsellText: "", ctaLabel: "", ctaPrice: "", showUpsell: false },
  };
  const u = upsellMap[context === "assist" ? "assist" : "free"];

  if (context === "marketing") {
    return (
      <section style={{ background: "#0E0C0B", color: "#F1F1F0", fontFamily: "'Hanken Grotesk',sans-serif", WebkitFontSmoothing: "antialiased" }}>
        {/* editorial intro */}
        <div style={{ padding: "clamp(64px,9vw,120px) clamp(24px,5vw,80px) clamp(48px,6vw,80px)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 9, fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  letterSpacing: ".16em", textTransform: "uppercase", color: "#7C8B74", marginBottom: "clamp(18px,2.5vw,28px)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C8B74", animation: "bsPulse 1.6s ease-in-out infinite" }} />
                Live · updated every 4 hours
              </div>
              <h2 style={{ fontSize: "clamp(40px,6.5vw,88px)", lineHeight: 0.93, letterSpacing: "-.045em", fontWeight: 800, margin: 0, maxWidth: "14ch" }}>
                The Live Global<br />Threat Board.
              </h2>
            </div>
            <p style={{ margin: 0, maxWidth: "44ch", fontSize: "clamp(15px,1.8vw,19px)", lineHeight: 1.7, color: "#A39C92" }}>
              Every real-world cyber threat, ranked the moment it lands — Act, Watch, or Calm. This is the same board every Pixqui user sees.
              Flip it to AI Assist to watch it narrow to a single person&apos;s risk in real time.
            </p>
          </div>
        </div>

        {/* board — flush, no gap */}
        <div style={{ borderTop: "1px solid #1a1714" }}>
          <ThreatBoard embed theme="dark" mode="free" />
        </div>

        {/* upsell */}
        <div style={{ padding: "18px clamp(24px,5vw,80px) clamp(48px,6vw,80px)" }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap",
              background: "#14110F", border: "1px solid #211E1A", borderRadius: 14, padding: "18px 24px", boxShadow: "0 18px 40px -22px rgba(0,0,0,.6)",
            }}
          >
            <span style={{ fontSize: "clamp(14px,1.6vw,16px)", lineHeight: 1.4, color: "#CFCBC4" }}>The list is everywhere. The calm is the rare part.</span>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 9, background: "#E8B923", color: "#14110F", borderRadius: 11,
                padding: "11px 20px", fontWeight: 700, fontSize: 14, boxShadow: "0 14px 28px -12px rgba(232,185,35,.6)", whiteSpace: "nowrap",
              }}
            >
              Start Pixqui Assist <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, opacity: 0.7 }}>$4/mo</span>
            </span>
          </div>
        </div>
      </section>
    );
  }

  // in-page wrapper (free / assist)
  return (
    <section
      style={{
        background: "#0E0C0B", color: "#F1F1F0", fontFamily: "'Hanken Grotesk',sans-serif", WebkitFontSmoothing: "antialiased",
        padding: "clamp(16px,2vw,28px) clamp(20px,5vw,80px) clamp(20px,2.5vw,36px)",
      }}
    >
      <div style={{ border: "1px solid #211E1A", borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 80px -34px rgba(0,0,0,.7)" }}>
        <ThreatBoard embed theme={boardTheme} mode={boardMode} />
      </div>

      {u.showUpsell && (
        <div
          style={{
            marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap",
            background: "#14110F", border: "1px solid #211E1A", borderRadius: 14, padding: "16px 22px", boxShadow: "0 14px 30px -18px rgba(0,0,0,.6)",
          }}
        >
          <span style={{ fontSize: "clamp(14px,1.6vw,16px)", lineHeight: 1.4, color: "#CFCBC4" }}>{u.upsellText}</span>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 9, background: "#E8B923", color: "#14110F", borderRadius: 11,
              padding: "10px 18px", fontWeight: 700, fontSize: 14, boxShadow: "0 12px 24px -10px rgba(232,185,35,.55)", whiteSpace: "nowrap",
            }}
          >
            {u.ctaLabel} <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, opacity: 0.7 }}>{u.ctaPrice}</span>
          </span>
        </div>
      )}
    </section>
  );
}
