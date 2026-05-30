import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

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

