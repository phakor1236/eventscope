import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats — aggregates for the dashboard
export async function GET() {
  const [byType, daily, stake, checkpoints] = await Promise.all([
    sql`
      SELECT event_name, count(*)::int AS count
      FROM events GROUP BY event_name ORDER BY count DESC`,
    sql`
      SELECT date_trunc('day', block_time)::date::text AS day, count(*)::int AS count
      FROM events GROUP BY 1 ORDER BY 1`,
    sql`
      SELECT coalesce(sum((args->>'stake')::numeric), 0)::text AS total_stake_wei
      FROM events WHERE event_name = 'DuelCreated'`,
    sql`SELECT contract_addr, last_block FROM checkpoints`,
  ]);

  return NextResponse.json({
    byType,
    daily,
    totalStakeWei: stake[0].total_stake_wei,
    checkpoints,
  });
}
