import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { PRICE_DUEL_ADDRESS, DEPLOY_BLOCK, PRICE_DUEL_EVENTS } from "./contract.js";
import { sql, migrate, insertEvents, type EventRow } from "./db.js";

// F2 backfill: scan deploy block -> chain tip in chunks and store every event.
// Safe to run any number of times — the unique key in db.ts makes it idempotent.

const CHUNK_SIZE = 9_999n;

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL || "https://sepolia.drpc.org"),
});

// getLogs doesn't return timestamps; fetch each block header once and cache it.
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

async function main() {
  await migrate();
  const latest = await client.getBlockNumber();
  console.log(`Backfill ${PRICE_DUEL_ADDRESS}`);
  console.log(`Blocks ${DEPLOY_BLOCK} -> ${latest}\n`);

  let scanned = 0;
  let inserted = 0;
  for (let from = DEPLOY_BLOCK; from <= latest; from += CHUNK_SIZE + 1n) {
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
        args: JSON.stringify(log.args, jsonSafe),
        block_number: log.blockNumber.toString(),
        block_time: await blockTime(log.blockNumber),
        tx_hash: log.transactionHash,
        log_index: log.logIndex,
      });
    }

    inserted += await insertEvents(rows);
    scanned += logs.length;
    console.log(`chunk ${from} -> ${to}: ${logs.length} events`);
  }

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM events`;
  console.log(`\nScanned ${scanned} | newly inserted ${inserted} | table now holds ${count} rows`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
