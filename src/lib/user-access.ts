import type { Pool } from '@neondatabase/serverless';

let ensured = false;

export async function ensureUserAccessColumns(pool: Pool) {
  if (ensured) return;

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS restricted_until TIMESTAMP NULL;

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS position VARCHAR(255) NULL;
  `);

  ensured = true;
}
