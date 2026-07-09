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

// type (not interface): postgres.js's bulk-insert helper needs an implicit
// index signature, which TS only gives to type aliases.
export type EventRow = {
  contract_addr: string;
  event_name: string;
  args: Record<string, unknown>; // plain object; the driver serializes it to jsonb exactly once
  block_number: string; // bigint as text; Postgres casts to int8 (driver's default types don't take JS bigint)
  block_time: Date | null;
  tx_hash: string;
  log_index: number;
};

// Idempotency invariant: (tx_hash, log_index) uniquely identifies a log on chain,
// so re-scanning any block range can never store the same event twice.
export async function insertEvents(rows: EventRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const inserted = await sql`
    INSERT INTO events ${sql(rows)}
    ON CONFLICT (tx_hash, log_index) DO NOTHING
    RETURNING id`;
  return inserted.length;
}
