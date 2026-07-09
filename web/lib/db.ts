import postgres from "postgres";

// One connection pool per process; cached on globalThis so Next.js dev
// hot-reload doesn't open a new pool on every file change.
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (web/.env.local)");
}

export const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL, { max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
