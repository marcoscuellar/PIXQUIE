# Backend Plan — from live fetch to a real edition pipeline

## Where we are now (this PR)

The Free-tier board is wired to **real CISA KEV data**, fetched on demand:

```
Browser (ThreatBoard)
   │  GET /api/threats        ← Next route handler, revalidate 14400s (4h)
   ▼
lib/threats.getThreats()
   ├─ lib/sources/cisaKev.fetchKev()   → latest 12 KEV entries (GitHub mirror → cisa.gov → bundled sample)
   ├─ lib/sources/nvd.fetchCvssScores() → best-effort CVSS per CVE
   └─ lib/rank.buildThreats()           → Act / Watch / Calm + surface/status/trend
```

It's stateless: every revalidation re-fetches and re-ranks. That's fine for one source and
12 rows, but it can't *diff editions*, *remember what it showed last time*, or *rewrite copy
per reader* — which is what the product actually promises. That needs a backend.

## Target architecture (Supabase + cron + Grok)

```
                 ┌─────────────────────── every 4h (06/10/14/18/22:00) ───────────────────────┐
                 │                                                                              │
   Supabase Cron (pg_cron)  ──►  Edge Function: ingest                                          │
                                   ├─ fetch CISA KEV, NVD recent-changes, vendor feeds          │
                                   ├─ normalise → upsert into `threats` (dedupe on cve_id)      │
                                   ├─ DIFF vs previous edition → mark new / changed / unchanged  │
                                   ├─ rank Act/Watch/Calm (lib/rank, shared)                     │
                                   └─ insert an `editions` row + `edition_items` join            │
                                                     │                                           │
                                   Edge Function: rewrite (Grok / xAI)  ◄──────────────────────┘
                                     └─ for each surfaced item, generate plain-English
                                        why/fix per reader persona → cache in `rewrites`
                 ▼
   Next.js  ──►  read from Supabase (RLS) instead of fetching feeds directly
                  • Free tier  → latest edition, neutral copy
                  • Assist     → persona-filtered items + cached Grok rewrites
```

### Data model (Postgres / Supabase)

| Table | Purpose |
|-------|---------|
| `threats` | One row per CVE/advisory. `cve_id` (unique), vendor, product, name, `cvss`, `kev` bool, `ransomware` bool, `tier`, `surface`, `source`, `first_seen`, `last_changed`, raw JSON. |
| `editions` | One row per 4-hour publish. `published_at`, source catalog versions, counts (act/watch/calm), `diff_summary`. |
| `edition_items` | Join: which threats surfaced in which edition + per-item `change` = `new` \| `changed` \| `unchanged`. |
| `rewrites` | `threat_id` × `persona` → Grok-generated `why` / `fix` text + model + token cost. Cached so we pay once per item-persona. |
| `sources` | Feed registry + last-fetched cursors (NVD `lastModStartDate`, KEV `catalogVersion`). |

### The ingest job (every 4 hours)

1. **Collect** — pull CISA KEV, NVD `cves/2.0?lastModStartDate=…` (the 4h window), and vendor advisory feeds. Reuse `lib/sources/*`.
2. **Normalise + upsert** into `threats` (dedupe on `cve_id`; update `cvss`/`last_changed` if NVD moved).
3. **Diff** the new candidate set against the previous edition's `edition_items` → tag `new` / `changed` / `unchanged`. Only new/changed advance (this is the "strips out anything unchanged" promise).
4. **Rank** with the shared `lib/rank` rules (CVSS + exploited + ransomware + recency).
5. **Publish** — write an `editions` row + `edition_items`. This is now the source of truth; the site reads editions, not live feeds.

Scheduling: **`pg_cron`** (`select cron.schedule('0 6,10,14,18,22 * * *', …)`) invoking a Supabase **Edge Function**, or Vercel Cron hitting an authed route. Cron at the five edition times rather than a fixed interval keeps it aligned to the published cadence.

### Grok rewriting (the Assist value)

- After publish, enqueue each **surfaced** item for rewriting. For each `(threat, persona)` not already in `rewrites`, call **Grok (xAI)** with a structured prompt: input = normalised threat + audience persona (`parent` / `older` / `pro` / `sec`); output = `{ why, fix }` in plain English, length-bounded.
- **Cache aggressively** in `rewrites` — copy only regenerates when the underlying threat's `last_changed` advances. This caps cost to roughly `new_items × active_personas` per edition, not per page view.
- Free tier shows the neutral machine copy; Assist swaps in the persona rewrite. The current `ThreatBoard` already models `mode: free | assist` and a `mine` filter, so the read path is a straight swap from hardcoded → Supabase query.

### Why this shape

- **Editions are immutable + diffable** → "what changed since you last looked" is a real query, not a guess.
- **Rewrites are cached** → Grok cost is bounded and predictable.
- **`lib/rank` and `lib/sources/*` are shared** between this PR's on-demand route and the future cron job — no logic fork.
- **Incremental** — drop Supabase behind `lib/threats.getThreats()` and the UI doesn't change.

### Rollout steps

1. Stand up Supabase; create the tables above; move `lib/sources/*` ingest into an Edge Function.
2. Add `pg_cron` at the five edition times; write `editions` + `edition_items` with diffing.
3. Point `getThreats()` at Supabase (read latest edition) behind a flag; keep live-fetch as fallback.
4. Add the Grok rewrite function + `rewrites` cache; wire Assist mode to persona rewrites.
5. Add auth (Supabase Auth) so onboarding `{role, interests}` persists server-side and drives the Assist `mine` filter for real.

### Env / secrets (future)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `XAI_API_KEY` (Grok), `NVD_API_KEY` (higher NVD rate limit). Today only `NVD_API_KEY` is read (optional).
