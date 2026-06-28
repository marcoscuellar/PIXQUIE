"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import PixquiMark from "./PixquiMark";

type Role = "parent" | "individual" | "smb" | "curious";

const ROLE_DEFS: { id: Role; label: string; sub: string; dot: string }[] = [
  { id: "parent", label: "Protecting my family & home", sub: "Home network, kids, shared devices", dot: "#CE8A10" },
  { id: "individual", label: "Looking after my own devices", sub: "Phone, laptop, accounts", dot: "#7C8B74" },
  { id: "smb", label: "Managing a small business", sub: "Staff, systems, client data", dot: "#A07850" },
  { id: "curious", label: "Just wanting to stay informed safely", sub: "No specific setup, just aware", dot: "#9b9a96" },
];

const INTEREST_DEFS: { id: string; label: string; dot: string }[] = [
  { id: "router", label: "Home router & network safety", dot: "#CE8A10" },
  { id: "phone", label: "Phone, browser & app security", dot: "#7C8B74" },
  { id: "scams", label: "Scams & phishing attempts", dot: "#BD4B2F" },
  { id: "kids", label: "Family & kids online protection", dot: "#A07850" },
  { id: "general", label: "General updates & good news", dot: "#6E7E62" },
];

const EDITIONS = [6, 10, 14, 18, 22];

export default function FreeOnboarding() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [role, setRole] = React.useState<Role | "">("");
  const [interests, setInterests] = React.useState<string[]>([]);

  // persist { role, interests }
  React.useEffect(() => {
    try {
      localStorage.setItem("pixqui:onboarding", JSON.stringify({ role, interests }));
    } catch {
      /* ignore */
    }
  }, [role, interests]);

  // next edition time
  const [nextEdition, setNextEdition] = React.useState("06:00");
  React.useEffect(() => {
    const h = new Date().getHours();
    const next = EDITIONS.find((e) => h < e) ?? EDITIONS[0];
    setNextEdition(next + ":00");
  }, []);

  const goFree = () => router.push("/");

  const canNext = (step === 1 && !!role) || step === 2;
  const showProgress = step === 1 || step === 2;
  const showSkip = step < 3;

  const next = () => {
    if (step === 0) setStep(1);
    else if (step === 1 && role) setStep(2);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh", background: "#F1F1F0", fontFamily: "'Hanken Grotesk',sans-serif",
        WebkitFontSmoothing: "antialiased", display: "flex", flexDirection: "column",
      }}
    >
      {/* TOPBAR */}
      <div
        style={{
          flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px clamp(20px,5vw,56px)", borderBottom: "1px solid #E4E0D8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <PixquiMark size={24} />
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-.03em", color: "#14110F" }}>Pixqui</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: ".08em", color: "#797977", border: "1px solid #DEDBD4", borderRadius: 999, padding: "2px 8px" }}>
            FREE
          </span>
        </div>
        {showSkip && (
          <button onClick={goFree} style={{ cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "#a3a29e", padding: 0 }}>
            Skip for now
          </button>
        )}
      </div>

      {/* PROGRESS DOTS (steps 1–2) */}
      {showProgress && (
        <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "clamp(14px,2vw,22px) 0 0" }}>
          {[1, 2].map((i) => (
            <span
              key={i}
              style={{ width: step === i ? "24px" : "6px", height: 5, borderRadius: 999, background: step >= i ? "#14110F" : "#DEDBD4", transition: "all .22s" }}
            />
          ))}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#c0bdb8", marginLeft: 8 }}>{step} / 2</span>
        </div>
      )}

      {/* SCREENS */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(20px,4vw,52px) clamp(20px,5vw,56px) clamp(28px,5vw,56px)" }}>
        {step === 0 && <StepWelcome nextEdition={nextEdition} onNext={next} />}
        {step === 1 && <StepRole role={role} onSelect={setRole} canNext={canNext} onNext={next} onBack={back} />}
        {step === 2 && (
          <StepInterests
            interests={interests}
            onToggle={(id) => setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))}
            onFinish={() => setStep(3)}
            onBack={back}
          />
        )}
        {step === 3 && <StepSuccess />}
      </div>
    </div>
  );
}

/* ======== STEP 0 · WELCOME ======== */
function StepWelcome({ nextEdition, onNext }: { nextEdition: string; onNext: () => void }) {
  return (
    <div style={{ animation: "obIn .38s ease-out", width: "min(600px,100%)", textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
          letterSpacing: ".14em", textTransform: "uppercase", color: "#9b8a63", marginBottom: "clamp(22px,3.5vw,36px)",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#CE8A10", animation: "sigPulse 2.2s ease-in-out infinite" }} />
        Signal live · next edition at <span suppressHydrationWarning>{nextEdition}</span>
      </div>

      <h1 style={{ fontSize: "clamp(38px,6.5vw,68px)", lineHeight: 0.95, letterSpacing: "-.04em", fontWeight: 800, margin: 0, color: "#14110F" }}>
        Welcome to a safer<br />corner of the internet.
      </h1>

      <p style={{ margin: "clamp(16px,2.5vw,24px) auto clamp(10px,1.5vw,14px)", maxWidth: "42ch", fontSize: "clamp(17px,2vw,21px)", lineHeight: 1.45, color: "#44403B", fontWeight: 600, letterSpacing: "-.01em" }}>
        Pixqui gives you clear, trustworthy threat intelligence — without the panic or noise.
      </p>
      <p style={{ margin: "0 auto", maxWidth: "44ch", fontSize: "clamp(14px,1.6vw,16px)", lineHeight: 1.75, color: "#797977" }}>
        This is a calm, moderated space where you can stay informed and know you&apos;re not alone.
      </p>

      <div style={{ marginTop: "clamp(28px,4vw,44px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: "clamp(40px,6vw,72px)" }}>
        <button
          onClick={onNext}
          style={{
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, background: "#F6AD2E", color: "#14110F", border: "none",
            borderRadius: 999, padding: "16px 34px", fontFamily: "inherit", fontSize: 17, fontWeight: 700, boxShadow: "0 18px 42px -14px rgba(206,138,16,.6)",
          }}
        >
          Show me today&apos;s threats <span style={{ fontSize: 19 }}>→</span>
        </button>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#c0bdb8", letterSpacing: ".02em" }}>
          A secure place to learn · No spam · Upgrade anytime
        </span>
      </div>
    </div>
  );
}

/* ======== STEP 1 · ROLE ======== */
function StepRole({
  role, onSelect, canNext, onNext, onBack,
}: {
  role: Role | "";
  onSelect: (r: Role) => void;
  canNext: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const nextBg = canNext ? "#14110F" : "#E4E0D8";
  const nextFg = canNext ? "#F1F1F0" : "#a3a29e";
  const nextShadow = canNext ? "0 12px 26px -10px rgba(20,17,15,.4)" : "none";

  return (
    <div style={{ animation: "obIn .35s ease-out", width: "min(680px,100%)" }}>
      <div style={{ marginBottom: "clamp(22px,3.5vw,36px)" }}>
        <h2 style={{ fontSize: "clamp(26px,4.5vw,46px)", lineHeight: 1.06, letterSpacing: "-.035em", fontWeight: 800, margin: "0 0 10px", color: "#14110F" }}>
          What feels most true for you right now?
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "#9b9a96" }}>Helps us frame threats in a way that makes sense for you.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        {ROLE_DEFS.map((r) => {
          const on = role === r.id;
          return (
            <button
              key={r.id}
              className="ob-role"
              onClick={() => onSelect(r.id)}
              style={{
                cursor: "pointer", textAlign: "left", background: on ? "#14110F" : "#fff", border: `2px solid ${on ? "#14110F" : "#E4E0D8"}`,
                borderRadius: 16, padding: "20px 18px", fontFamily: "inherit", transition: "border-color .15s, background .15s",
                boxShadow: on ? "0 0 0 1px rgba(20,17,15,.08), 0 14px 28px -12px rgba(20,17,15,.4)" : "0 2px 8px -4px rgba(20,17,15,.08)",
              }}
            >
              <span style={{ display: "block", width: 9, height: 9, borderRadius: "50%", background: r.dot, marginBottom: 12 }} />
              <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: on ? "#F1F1F0" : "#14110F", lineHeight: 1.2 }}>{r.label}</span>
              <span style={{ display: "block", fontSize: 13, color: on ? "#A39C92" : "#9b9a96", marginTop: 4, lineHeight: 1.35 }}>{r.sub}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
        <button onClick={onBack} style={{ cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", fontSize: 14, color: "#c0bdb8" }}>← Back</button>
        <button
          onClick={onNext}
          style={{ cursor: "pointer", background: nextBg, color: nextFg, border: "none", borderRadius: 999, padding: "12px 26px", fontFamily: "inherit", fontSize: 15, fontWeight: 700, transition: "background .15s", boxShadow: nextShadow }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

/* ======== STEP 2 · INTERESTS ======== */
function StepInterests({
  interests, onToggle, onFinish, onBack,
}: {
  interests: string[];
  onToggle: (id: string) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <div style={{ animation: "obIn .35s ease-out", width: "min(640px,100%)" }}>
      <div style={{ marginBottom: "clamp(20px,3vw,32px)" }}>
        <h2 style={{ fontSize: "clamp(26px,4.5vw,46px)", lineHeight: 1.06, letterSpacing: "-.035em", fontWeight: 800, margin: "0 0 10px", color: "#14110F" }}>
          What would you like us to keep an eye on for you?
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "#9b9a96" }}>You can change this anytime.</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {INTEREST_DEFS.map((it) => {
          const on = interests.includes(it.id);
          return (
            <button
              key={it.id}
              className="ob-chip"
              onClick={() => onToggle(it.id)}
              style={{
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, background: on ? "#14110F" : "#fff",
                border: `2px solid ${on ? "#14110F" : "#E4E0D8"}`, borderRadius: 999, padding: "11px 18px", fontFamily: "inherit",
                fontSize: 14.5, fontWeight: 600, color: on ? "#F1F1F0" : "#44403B", transition: "all .15s",
              }}
            >
              <span style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", background: on ? "#F6AD2E" : it.dot }} />
              {it.label}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
        <button onClick={onBack} style={{ cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", fontSize: 14, color: "#c0bdb8" }}>← Back</button>
        <button
          onClick={onFinish}
          style={{ cursor: "pointer", background: "#14110F", color: "#F1F1F0", border: "none", borderRadius: 999, padding: "13px 28px", fontFamily: "inherit", fontSize: 15, fontWeight: 700, boxShadow: "0 14px 30px -12px rgba(20,17,15,.45)" }}
        >
          See my feed →
        </button>
      </div>
    </div>
  );
}

/* ======== STEP 3 · SUCCESS ======== */
function StepSuccess() {
  return (
    <div style={{ animation: "obPop .44s ease-out", width: "min(820px,100%)" }}>
      <div style={{ marginBottom: "clamp(18px,2.5vw,26px)" }}>
        <h2 style={{ fontSize: "clamp(38px,6vw,68px)", lineHeight: 0.95, letterSpacing: "-.04em", fontWeight: 800, margin: 0, color: "#14110F" }}>You&apos;re safe here.</h2>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(15px,1.8vw,18px)", color: "#44403B", lineHeight: 1.6, maxWidth: "56ch" }}>
          You&apos;ve joined a secure, supportive space where threats are explained clearly and fixes are made simple. Today&apos;s Secure Overview:
        </p>
      </div>

      {/* live preview cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "clamp(22px,3vw,30px)" }}>
        <PreviewCard iconBg="#F6E0D8" dot="#BD4B2F" badge="ACT" badgeColor="#BD4B2F" badgeBg="#F6E0D8" meta="HOME NET · Router" title="Home Router Advisory (CVE-2026-2741)" body="Active · Many people are safely updating today." />
        <PreviewCard iconBg="#F8ECCF" dot="#CE8A10" badge="WATCH" badgeColor="#CE8A10" badgeBg="#F8ECCF" meta="PHONE · SMS scam" title="Courier Text Scam Wave" body="Watch · Easy to avoid — we'll show you exactly how." />
        <PreviewCard iconBg="#E5E8DF" dot="#7C8B74" badge="CALM" badgeColor="#6E7E62" badgeBg="#E5E8DF" meta="iPhone · Good news" title="Good News: Major iOS Security Update Available" body="Your phone may have already applied it — nothing to worry about." />
      </div>

      {/* primary CTAs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: "clamp(16px,2vw,22px)" }}>
        <a href="/" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", background: "#14110F", color: "#F1F1F0", borderRadius: 999, padding: "14px 26px", fontFamily: "inherit", fontSize: 15, fontWeight: 700, boxShadow: "0 14px 34px -12px rgba(20,17,15,.5)" }}>
          Browse the Secure Threat Feed →
        </a>
        <a href="#" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", background: "#fff", color: "#14110F", border: "1.5px solid #E4E0D8", borderRadius: 999, padding: "13px 22px", fontFamily: "inherit", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 14px -8px rgba(20,17,15,.1)" }}>
          Enter the Community
        </a>
      </div>

      {/* soft Assist upsell */}
      <div style={{ background: "#14110F", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", boxShadow: "0 14px 36px -16px rgba(20,17,15,.4)" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F1F0", marginBottom: 4 }}>Upgrade to AI Assist →</div>
          <div style={{ fontSize: 13, color: "#A39C92", lineHeight: 1.4 }}>Get personalized protection guidance, plain-English mitigations, and community priority.</div>
        </div>
        <a href="#" style={{ flex: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", background: "#F6AD2E", color: "#14110F", borderRadius: 999, padding: "10px 20px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, boxShadow: "0 10px 24px -10px rgba(206,138,16,.5)" }}>
          Try Assist · $4/mo
        </a>
      </div>

      <p style={{ margin: "clamp(18px,2.5vw,26px) 0 0", textAlign: "center", fontSize: 14, color: "#a3a29e", lineHeight: 1.6 }}>
        This is your safe place to stay informed.<br />
        We&apos;re here to help you protect what matters — one calm step at a time.
      </p>
    </div>
  );
}

function PreviewCard({
  iconBg, dot, badge, badgeColor, badgeBg, meta, title, body,
}: {
  iconBg: string; dot: string; badge: string; badgeColor: string; badgeBg: string; meta: string; title: string; body: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EBE8E1", borderRadius: 18, padding: "clamp(16px,2vw,22px) clamp(18px,2.2vw,24px)", boxShadow: "0 2px 4px rgba(20,17,15,.04), 0 18px 36px -22px rgba(20,17,15,.2)", display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{ flex: "none", marginTop: 2, width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: dot }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 7 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: badgeColor, background: badgeBg, padding: "3px 9px", borderRadius: 999 }}>
            {badge}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#a3a29e", letterSpacing: ".04em" }}>{meta}</span>
        </div>
        <div style={{ fontSize: "clamp(14px,1.7vw,16px)", fontWeight: 700, color: "#14110F", lineHeight: 1.25, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "#797977", lineHeight: 1.4 }}>{body}</div>
      </div>
    </div>
  );
}
