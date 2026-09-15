import { createECDH } from 'node:crypto';
import webpush from 'web-push';
import type { Pool } from '@neondatabase/serverless';
import { getPool } from '@/lib/db';

let ensured = false;
let vapidConfigured = false;

function toBase64Url(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Checks that the configured public key is the one that belongs to the configured
 * private key, by deriving the public point from the private scalar.
 *
 * Mixing keys from two different pairs is an easy deployment slip and produces no
 * error at subscribe time - the browser happily registers against whatever public key
 * the page served. It only fails later, at send time, as a 400 from the push service.
 * Catching it here turns a silent dead end into a startup-visible misconfiguration.
 */
export function vapidPairMatches() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) return false;

  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(Buffer.from(privateKey, 'base64url'));
    return toBase64Url(ecdh.getPublicKey()) === publicKey;
  } catch {
    return false;
  }
}

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT &&
      vapidPairMatches()
  );
}

function configureVapid() {
  if (vapidConfigured) return true;

  const hasAllVars = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );

  if (!hasAllVars) {
    console.error('Push disabled: VAPID environment variables are incomplete', {
      code: 'PUSH_VAPID_MISSING',
      hasPublicKey: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      hasPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY),
      hasSubject: Boolean(process.env.VAPID_SUBJECT),
    });
    return false;
  }

  if (!vapidPairMatches()) {
    console.error(
      'Push disabled: NEXT_PUBLIC_VAPID_PUBLIC_KEY does not belong to VAPID_PRIVATE_KEY. ' +
        'Both must come from the same generated pair, in every environment.',
      { code: 'PUSH_VAPID_PAIR_MISMATCH' }
    );
    return false;
  }

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
        const { statusCode, body: errorBody } = error as { statusCode?: number; body?: string };

        // 404/410 mean the browser threw the subscription away - stop writing to it.
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(row.id);
          return;
        }

        // The subscription was created against a different VAPID key, so it can never
        // be delivered to again. Dropping it lets the device re-subscribe cleanly with
        // the current key instead of failing forever.
        if (statusCode === 400 && /VapidPkHashMismatch/i.test(errorBody ?? '')) {
          console.error(
            'Push subscription was created with a different VAPID key and has been removed. ' +
              'The device must enable notifications again.',
            { code: 'PUSH_VAPID_KEY_ROTATED', subscriptionId: row.id }
          );
          staleIds.push(row.id);
          return;
        }

        console.error('Push delivery failed', {
          code: 'PUSH_SEND_FAILED',
          statusCode,
          body: errorBody,
        });
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
