# EventScope

A hand-rolled on-chain event indexer + analytics dashboard. It watches the
[PriceDuel](https://github.com/phakor1236/flipside) contract (FlipSide, Sepolia),
streams its events into Postgres, and serves them through an API and a live
dashboard.

**Live dashboard:** _(Vercel URL — added at deploy)_

## Architecture

```
Sepolia (PriceDuel 0x769d…b7af)
        │  eth_getLogs, chunked (free-tier RPC caps ranges)
        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ indexer daemon  │ ──▶ │ Postgres (Neon)  │ ◀── │ Next.js app (Vercel)│
│ (Railway, TS)   │     │ events(+jsonb)   │     │ /api/events /stats  │
│ poll → decode → │     │ checkpoints      │     │ Recharts dashboard  │
│ store → advance │     └──────────────────┘     └─────────────────────┘
└─────────────────┘
```

- `src/indexer.ts` — long-running daemon: scan from checkpoint in ≤10k-block
  chunks, decode via ABI, store, advance the checkpoint.
- `src/store.ts` — one-shot backfill of the same pipeline.
- `src/probe.ts` — diagnostic: print events to the terminal.
- `web/` — Next.js app: API route handlers reading Postgres + a one-page
  Recharts dashboard.

## Core invariants (the part worth reading)

1. **No double-count.** `(tx_hash, log_index)` uniquely identifies a log
   on-chain; a unique key + `ON CONFLICT DO NOTHING` makes every write
   idempotent, so re-scanning any range is always safe.
2. **No gap.** The checkpoint advances **in the same transaction** that stores
   the chunk's events. A crash can only leave the checkpoint *behind* reality
   (safe — rescan dedupes), never ahead (which would silently skip blocks).
3. **Chunked scanning.** Free RPC tiers cap `eth_getLogs` ranges (drpc: 10k
   blocks), so the scanner walks the range in chunks and commits per chunk.

## Design decisions

| Decision | Choice | Why |
|---|---|---|
| Indexing approach | Hand-rolled TS service (not The Graph / Ponder) | every line is defensible; the checkpoint/idempotency machinery is the point |
| Schema | One generic `events` table, args as `jsonb` | new contracts need zero migrations; jsonb covers the dashboard queries |
| Dedupe key | `UNIQUE (tx_hash, log_index)` | the chain's own identity for a log |
| Checkpoint | same-transaction advance | crash-safe by construction |
| App shape | Next.js API routes + dashboard in one app | one deploy, no CORS; indexer stays a separate daemon |
| DB | Postgres on Neon | industry default; serverless free tier follows to prod |

(Full log with dates and rejected options: [`DECISIONS.md`](./DECISIONS.md).)

## Run it locally

```bash
# indexer
npm install
cp .env.example .env         # add DATABASE_URL (Postgres) and optional RPC_URL
npm run store                # one-shot backfill
npm run index                # or: continuous daemon

# dashboard
cd web && npm install
echo DATABASE_URL=... > .env.local
npm run dev
```

## Roadmap

- [ ] Second contract (the schema is already generic)
- [ ] Side-by-side subgraph implementation + writeup of the tradeoffs
