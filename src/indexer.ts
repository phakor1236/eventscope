import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { PRICE_DUEL_ADDRESS, DEPLOY_BLOCK, PRICE_DUEL_EVENTS } from "./contract.js";
import { sql, migrate, type EventRow } from "./db.js";

// F3 — the indexer daemon (core 20%).
// Invariants:
//   1. No gap: every block up to the stored checkpoint has been scanned.
//   2. No double count: re-scanning is always safe (unique key in db.ts), so the
//      checkpoint may lag behind reality after a crash — never run ahead of it.
//   3. The checkpoint advances in the same transaction that stores the chunk's
//      events: either both happen or neither does.

const CHUNK_SIZE = 9_999n;
const POLL_MS = 15_000;

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL || "https://sepolia.drpc.org"),
});

const blockTimeCache = new Map<bigint, Date>();
async function blockTime(blockNumber: bigint): Promise<Date> {
  const hit = blockTimeCache.get(blockNumber);
  if (hit) return hit;
  const block = await client.getBlock({ blockNumber });
  const time = new Date(Number(block.timestamp) * 1000);
  blockTimeCache.set(blockNumber, time);
  return time;
}

const jsonSafe = (_: string, v: unknown) => (typeof v === "bigint" ? v.toString() : v);

async function readCheckpoint(): Promise<bigint> {
  const rows = await sql`
    SELECT last_block FROM checkpoints WHERE contract_addr = ${PRICE_DUEL_ADDRESS}`;
  return rows.length ? BigInt(rows[0].last_block) : DEPLOY_BLOCK - 1n;
}

async function commitChunk(rows: EventRow[], scannedTo: bigint) {
  await sql.begin(async (tx) => {
    for (const r of rows) {
      await tx`
        INSERT INTO events (contract_addr, event_name, args, block_number, block_time, tx_hash, log_index)
        VALUES (${r.contract_addr}, ${r.event_name}, ${tx.json(r.args)}, ${r.block_number},
                ${r.block_time}, ${r.tx_hash}, ${r.log_index})
        ON CONFLICT (tx_hash, log_index) DO NOTHING`;
    }
    await tx`
      INSERT INTO checkpoints (contract_addr, last_block)
      VALUES (${PRICE_DUEL_ADDRESS}, ${scannedTo.toString()})
      ON CONFLICT (contract_addr) DO UPDATE SET last_block = EXCLUDED.last_block`;
  });
}

async function catchUp() {
  const latest = await client.getBlockNumber();
  let from = (await readCheckpoint()) + 1n;
  if (from > latest) return;

  while (from <= latest) {
    const to = from + CHUNK_SIZE > latest ? latest : from + CHUNK_SIZE;
    const logs = await client.getLogs({
      address: PRICE_DUEL_ADDRESS,
      events: PRICE_DUEL_EVENTS,
      fromBlock: from,
      toBlock: to,
    });

    const rows: EventRow[] = [];
    for (const log of logs) {
      rows.push({
        contract_addr: PRICE_DUEL_ADDRESS,
        event_name: log.eventName,
        args: JSON.parse(JSON.stringify(log.args, jsonSafe)), // round-trip converts bigints to strings
        block_number: log.blockNumber.toString(),
        block_time: await blockTime(log.blockNumber),
        tx_hash: log.transactionHash,
        log_index: log.logIndex,
      });
    }

    await commitChunk(rows, to);
    if (logs.length > 0) {
      console.log(`stored ${logs.length} events from blocks ${from} -> ${to}`);
    }
    from = to + 1n;
  }
}

async function main() {
  await migrate();
  console.log(`indexer up — resuming after block ${await readCheckpoint()}`);
  for (;;) {
    try {
      await catchUp();
    } catch (err) {
      console.error("iteration failed (will retry):", err instanceof Error ? err.message : err);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
