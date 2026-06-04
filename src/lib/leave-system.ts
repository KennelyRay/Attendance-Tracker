import type { Pool } from '@neondatabase/serverless';
import { ensureUserAccessColumns } from '@/lib/user-access';

let ensured = false;

export async function ensureLeaveSystemSchema(pool: Pool) {
  await ensureUserAccessColumns(pool);

  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      leave_type VARCHAR(64) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days INTEGER NOT NULL,
      reason TEXT NOT NULL,
      deduct_from_paid_balance BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      admin_notes TEXT NULL,
      reviewed_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT leave_requests_date_range CHECK (end_date >= start_date),
      CONSTRAINT leave_requests_total_days CHECK (total_days > 0),
      CONSTRAINT leave_requests_status CHECK (status IN ('pending', 'approved', 'rejected'))
    );

    CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status
      ON leave_requests(user_id, status, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_leave_requests_status_created
      ON leave_requests(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS leave_request_attachments (
      id SERIAL PRIMARY KEY,
      leave_request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NOT NULL,
      file_size INTEGER NOT NULL CHECK (file_size > 0),
      file_data BYTEA NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leave_request_attachments_request
      ON leave_request_attachments(leave_request_id, created_at ASC, id ASC);
  `);

  ensured = true;
}
