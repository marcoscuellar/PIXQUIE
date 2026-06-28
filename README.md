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
