import webpush from 'web-push';
import type { Pool } from '@neondatabase/serverless';
import { getPool } from '@/lib/db';

let ensured = false;
let vapidConfigured = false;

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

function configureVapid() {
  if (vapidConfigured || !isPushConfigured()) return vapidConfigured;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );
  vapidConfigured = true;
  return true;
}

export async function ensurePushSchema(pool: Pool) {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP NULL
    );

    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
      ON push_subscriptions(user_id);
  `);

  ensured = true;
}

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(
  userId: number,
  subscription: PushSubscriptionInput,
  userAgent?: string | null
) {
  const pool = getPool();
  await ensurePushSchema(pool);

  // The same browser re-subscribing must not create a duplicate row, and a device
  // handed to a different employee must follow the new owner.
  await pool.query(
    `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (endpoint) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth,
            user_agent = EXCLUDED.user_agent
    `,
    [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent ?? null]
  );
}

export async function removePushSubscription(endpoint: string) {
  const pool = getPool();
  await ensurePushSchema(pool);
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
}

export async function countPushSubscriptions(userId: number) {
  const pool = getPool();
  await ensurePushSchema(pool);
  const result = await pool.query(
    'SELECT COUNT(*)::int AS total FROM push_subscriptions WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]?.total ?? 0;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Opened when the notification is tapped. */
  url?: string;
  /** Collapses older notifications of the same kind. */
  tag?: string;
};

async function sendToUserIds(userIds: number[], payload: PushPayload) {
  if (userIds.length === 0) return;
  if (!configureVapid()) {
    console.warn('Push not sent: VAPID keys are not configured', { title: payload.title });
    return;
  }

  const pool = getPool();
  await ensurePushSchema(pool);

  const result = await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::int[])',
    [userIds]
  );

  const body = JSON.stringify(payload);
  const staleIds: number[] = [];

  await Promise.all(
    result.rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the browser threw the subscription away - stop writing to it.
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(row.id);
          return;
        }
        console.error('Push delivery failed', { code: 'PUSH_SEND_FAILED', statusCode });
      }
    })
  );

  if (staleIds.length > 0) {
    await pool.query('DELETE FROM push_subscriptions WHERE id = ANY($1::int[])', [staleIds]);
  }

  if (result.rows.length > staleIds.length) {
    await pool.query(
      'UPDATE push_subscriptions SET last_used_at = CURRENT_TIMESTAMP WHERE user_id = ANY($1::int[])',
      [userIds]
    );
  }
}

/**
 * Notifications are best-effort: a push failure must never turn a completed HR action
 * into a failed request, so everything here swallows its own errors.
 */
export async function notifyUser(userId: number, payload: PushPayload) {
  try {
    await sendToUserIds([userId], payload);
  } catch (error) {
    console.error('notifyUser failed', {
      code: 'PUSH_NOTIFY_USER_FAILED',
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}

export async function notifyAdmins(payload: PushPayload) {
  try {
    const pool = getPool();
    const admins = await pool.query('SELECT id FROM users WHERE is_admin = true');
    await sendToUserIds(
      admins.rows.map((row) => row.id as number),
      payload
    );
  } catch (error) {
    console.error('notifyAdmins failed', {
      code: 'PUSH_NOTIFY_ADMINS_FAILED',
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}
