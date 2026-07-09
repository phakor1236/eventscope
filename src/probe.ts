import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { PRICE_DUEL_ADDRESS, DEPLOY_BLOCK, PRICE_DUEL_EVENTS } from "./contract.js";

// F1 probe: prove we can see the contract's events from here.
// Free RPC tiers cap eth_getLogs ranges (drpc: 10k blocks), so we scan in chunks.

const CHUNK_SIZE = 9_999n;

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL || "https://sepolia.drpc.org"),
});

async function main() {
  const latest = await client.getBlockNumber();
  console.log(`Scanning PriceDuel ${PRICE_DUEL_ADDRESS}`);
  console.log(`Blocks ${DEPLOY_BLOCK} -> ${latest}\n`);

  let total = 0;
  for (let from = DEPLOY_BLOCK; from <= latest; from += CHUNK_SIZE + 1n) {
    const to = from + CHUNK_SIZE > latest ? latest : from + CHUNK_SIZE;
    const logs = await client.getLogs({
      address: PRICE_DUEL_ADDRESS,
      events: PRICE_DUEL_EVENTS,
      fromBlock: from,
      toBlock: to,
    });
    console.log(`chunk ${from} -> ${to}: ${logs.length} events`);
    for (const log of logs) {
      console.log(`  [block ${log.blockNumber} | log ${log.logIndex}] ${log.eventName}`);
      console.log(`    args: ${JSON.stringify(log.args, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`);
      console.log(`    tx:   ${log.transactionHash}`);
    }
    total += logs.length;
  }
  console.log(`\nTotal: ${total} events`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
