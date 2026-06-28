# Pixqui — Free Tier

Next.js (App Router) + TypeScript implementation of the Pixqui **Free tier** design
handoff: the Free Onboarding flow and the Free Edition feed page, recreated as
pixel-faithful translations of the high-fidelity HTML references.

## Routes

| Path           | Screen                                                      |
|----------------|------------------------------------------------------------|
| `/`            | **Free Edition** — sticky header, hero with live counter, embedded Live Global Threat Board, "Where the signal comes from" section, sign-off footer |
| `/onboarding`  | **Free Onboarding** — Welcome → Role → Interests → Success  |

## Components

- `components/FreeEdition.tsx` — the main free product page.
- `components/FreeOnboarding.tsx` — 3-step onboarding (+ success). Persists
  `{ role, interests }` to `localStorage` under `pixqui:onboarding`. Next-edition
  time is computed from the `[06, 10, 14, 18, 22]:00` schedule. "Skip for now"
  (steps 0–2) routes to the Free Edition.
- `components/BoardWrapper.tsx` — the outer "what we see onsite" wrapper. Supports
  `context="free" | "assist" | "marketing"`; the marketing treatment renders the
  full editorial dark intro with the board flush below.
- `components/ThreatBoard.tsx` — the Live Global Threat Board. Live clock + scan
  counter, scrolling ticker tape, wide 8-column table / narrow card list (switched
  via `ResizeObserver` at 720px), `dark` / `mono` / `light` themes, and a
  `FREE` / `AI ASSIST` mode toggle that filters the board to "what reaches you".
- `components/PixquiMark.tsx` — the parameterised spiral logo mark.

## Live data (Free tier)

The Live Global Threat Board is wired to **real CISA KEV** (Known Exploited Vulnerabilities)
data — the hardcoded array in `ThreatBoard.tsx` is now only a fallback.

```
ThreatBoard (client) ──GET /api/threats──► lib/threats.getThreats()
                                              ├─ lib/sources/cisaKev.ts  — latest 12 KEV entries
                                              ├─ lib/sources/nvd.ts      — best-effort CVSS per CVE
                                              └─ lib/rank.ts             — Act / Watch / Calm ranking
```

- **Source:** CISA KEV via the GitHub mirror (`cisagov/kev-data`), falling back to the
  canonical `cisa.gov` feed, then to a bundled recent snapshot (`SAMPLE_KEV`) so the board is
  never empty. Cached 4h (`revalidate: 14400`) to match the edition cadence.
- **Ranking** (`lib/rank.ts`): everything in KEV is actively exploited, so —
  `ACT` = ransomware-linked OR CVSS ≥ 9 OR added in the last 7 days; `WATCH` = CVSS ≥ 7 or
  unknown score; `CALM` = CVSS < 7. (CALM is usually empty from KEV alone — green "good news"
  rows come from other sources, see `BACKEND_PLAN.md`.)
- **CVSS** is enriched from **NVD** best-effort (the KEV feed has no scores). Unresolved CVEs
  show `—`. Set `NVD_API_KEY` for a higher rate limit; see `.env.example`.
- The board carries a small "Data source: CISA KEV · CVSS via NVD" provenance label.

`npx tsx scripts/preview-threats.ts <kev.json>` runs the pure parse/rank/map pipeline against
a local KEV snapshot for quick verification.

See **`BACKEND_PLAN.md`** for the future pipeline (Supabase cron + edition diffing + Grok rewriting).

## Design tokens

Brand system: warm-paper (`#F1F1F0`) + ink (`#14110F`) + amber (`#F6AD2E`),
Hanken Grotesk (UI) + JetBrains Mono (badges/meta/counters). Colours, shadows,
typography and animations are taken directly from the handoff README and the HTML
references. Keyframes and hover states live in `app/globals.css`; all other styling
is inline to match the reference values exactly.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Scope note

This is the **Free tier** only. The success screen's "Enter the Community" and
"Try Assist" links, plus the Free Edition's Assist upsell, point to placeholders
(`#`) — those destinations are out of scope for this package.
