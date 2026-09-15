import { Pool, neonConfig, types } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

/**
 * Return DATE columns as plain `YYYY-MM-DD` strings instead of JS Date objects.
 *
 * A DATE has no time and no zone, but the driver parses it to midnight *local* time.
 * Serializing that back through UTC - which JSON.stringify and toISOString both do -
 * moves the calendar day backwards on any server east of UTC, so in Asia/Manila a
 * start date of 2026-07-04 reached the browser as 2026-07-03. Keeping the raw string
 * means the value that leaves Postgres is the value the UI renders.
 */
const POSTGRES_DATE_OID = 1082;
types.setTypeParser(POSTGRES_DATE_OID, (value: string) => value);

let pool: Pool | null = null;

declare global {
  var __pool: Pool | undefined;
}

export function getPool(): Pool {
  if (!pool) {
    if (!global.__pool) {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
      }
      global.__pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    }
    pool = global.__pool;
  }
  return pool;
}

