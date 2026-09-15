import type { Pool } from '@neondatabase/serverless';
import { getPool } from '@/lib/db';
import type { AuditAction, AuditCategory } from '@/modules/audit/types';

let ensured = false;

export async function ensureAuditLogSchema(pool: Pool) {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      actor_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
      actor_name VARCHAR(255) NOT NULL,
      actor_email VARCHAR(255) NULL,
      category VARCHAR(32) NOT NULL,
      action VARCHAR(64) NOT NULL,
      target_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
      target_user_name VARCHAR(255) NULL,
      entity_id INTEGER NULL,
      summary TEXT NOT NULL,
      details JSONB NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT audit_log_category CHECK (
        category IN ('account', 'attendance', 'leave', 'violation')
      )
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_created
      ON audit_log(created_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS idx_audit_log_category_created
      ON audit_log(category, created_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS idx_audit_log_target_created
      ON audit_log(target_user_id, created_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created
      ON audit_log(actor_id, created_at DESC, id DESC);
  `);

  ensured = true;
}

export type RecordAuditEventInput = {
  /** Null marks an automated action taken by the system rather than a person. */
  actorId: number | null;
  actorName?: string | null;
  actorEmail?: string | null;
  category: AuditCategory;
  action: AuditAction;
  targetUserId?: number | null;
  targetUserName?: string | null;
  entityId?: number | null;
  summary: string;
  details?: Record<string, unknown> | null;
};

/**
 * Writes one audit entry.
 *
 * Audit writes never surface failures to the caller: an admin action that already
 * succeeded must not be reported as failed because its log entry could not be
 * stored. Failures are logged to the server console for follow-up instead.
 */
export async function recordAuditEvent(input: RecordAuditEventInput) {
  try {
    const pool = getPool();
    await ensureAuditLogSchema(pool);

    await pool.query(
      `
        INSERT INTO audit_log (
          actor_id,
          actor_name,
          actor_email,
          category,
          action,
          target_user_id,
          target_user_name,
          entity_id,
          summary,
          details
        )
        VALUES (
          $1,
          COALESCE($2, (SELECT name FROM users WHERE id = $1), 'System'),
          COALESCE($3, (SELECT email FROM users WHERE id = $1)),
          $4,
          $5,
          $6,
          COALESCE($7, (SELECT name FROM users WHERE id = $6)),
          $8,
          $9,
          $10
        )
      `,
      [
        input.actorId,
        input.actorName ?? null,
        input.actorEmail ?? null,
        input.category,
        input.action,
        input.targetUserId ?? null,
        input.targetUserName ?? null,
        input.entityId ?? null,
        input.summary,
        input.details ? JSON.stringify(input.details) : null,
      ]
    );
  } catch (error) {
    console.error('Audit log write failed', {
      code: 'AUDIT_LOG_WRITE_FAILED',
      action: input.action,
      entityId: input.entityId ?? null,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}
