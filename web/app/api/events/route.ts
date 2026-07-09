import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/events?limit=25&offset=0 — newest first
export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 25, 100);
  const offset = Math.max(Number(req.nextUrl.searchParams.get("offset")) || 0, 0);

  const events = await sql`
    SELECT event_name, args, block_number, block_time, tx_hash, log_index
    FROM events
    ORDER BY block_number DESC, log_index DESC
    LIMIT ${limit} OFFSET ${offset}`;

  return NextResponse.json({ events });
}
