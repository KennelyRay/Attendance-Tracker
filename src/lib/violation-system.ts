import type { Pool } from '@neondatabase/serverless';
import { ensureUserAccessColumns } from '@/lib/user-access';

let ensured = false;

export async function ensureViolationSystemSchema(pool: Pool) {
  await ensureUserAccessColumns(pool);

  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_violations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      violation_type VARCHAR(120) NOT NULL,
      company VARCHAR(255) NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'medium',
      case_status VARCHAR(20) NOT NULL DEFAULT 'open',
      incident_date DATE NOT NULL,
      description TEXT NOT NULL,
      action_taken TEXT NULL,
      created_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT employee_violations_severity CHECK (severity IN ('low', 'medium', 'high')),
      CONSTRAINT employee_violations_case_status CHECK (
        case_status IN ('open', 'under-review', 'resolved')
      )
    );

    CREATE INDEX IF NOT EXISTS idx_employee_violations_user_created
      ON employee_violations(user_id, incident_date DESC, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_employee_violations_created
      ON employee_violations(incident_date DESC, created_at DESC);
  `);

  ensured = true;
}
