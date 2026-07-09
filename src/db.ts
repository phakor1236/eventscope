import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy your Neon connection string into .env (see .env.example).");
}

export const sql = postgres(url, { max: 5 });

export async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id            bigserial   PRIMARY KEY,
      contract_addr text        NOT NULL,
      event_name    text        NOT NULL,
      args          jsonb       NOT NULL,
      block_number  bigint      NOT NULL,
      block_time    timestamptz,
      tx_hash       text        NOT NULL,
      log_index     integer     NOT NULL,
      UNIQUE (tx_hash, log_index)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS checkpoints (
      contract_addr text   PRIMARY KEY,
      last_block    bigint NOT NULL
    )`;
}

export type EventRow = {
  contract_addr: string;
  event_name: string;
  args: postgres.JSONValue; // plain object (bigints pre-converted); sql.json() serializes it exactly once
  block_number: string; // bigint as text; Postgres casts to int8
  block_time: Date | null;
  tx_hash: string;
  log_index: number;
};

// Idempotency invariant: (tx_hash, log_index) uniquely identifies a log on chain,
// so re-scanning any block range can never store the same event twice.
// Row-by-row inside one transaction — fine at this volume; batch it if that ever changes.
export async function insertEvents(rows: EventRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  let inserted = 0;
  await sql.begin(async (tx) => {
    for (const r of rows) {
      const res = await tx`
        INSERT INTO events (contract_addr, event_name, args, block_number, block_time, tx_hash, log_index)
        VALUES (${r.contract_addr}, ${r.event_name}, ${tx.json(r.args)}, ${r.block_number},
                ${r.block_time}, ${r.tx_hash}, ${r.log_index})
        ON CONFLICT (tx_hash, log_index) DO NOTHING
        RETURNING id`;
      inserted += res.length;
    }
  });
  return inserted;
}
