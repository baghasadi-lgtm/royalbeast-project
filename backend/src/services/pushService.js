import webpush from 'web-push';
import pool from '../db.js';

let vapidReady = false;

export const initWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:owner@royalbeast.local';

  if (!publicKey || !privateKey) {
    console.warn('⚠️  VAPID keys belum di-set. Push notifikasi owner nonaktif.');
    console.warn('   Jalankan: node scripts/generate-vapid.js');
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
};

export const getVapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;

export const isPushEnabled = () => vapidReady;

const toSubscription = (row) => ({
  endpoint: row.endpoint,
  keys: { p256dh: row.p256dh, auth: row.auth },
});

export const savePushSubscription = async (userId, subscription, userAgent = null) => {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Subscription tidak valid');
  }

  await pool.query(
    `
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      user_agent = EXCLUDED.user_agent
    `,
    [userId, endpoint, keys.p256dh, keys.auth, userAgent]
  );
};

export const removePushSubscription = async (userId, endpoint) => {
  await pool.query(
    `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
    [userId, endpoint]
  );
};

export const removeAllPushSubscriptions = async (userId) => {
  await pool.query(`DELETE FROM push_subscriptions WHERE user_id = $1`, [userId]);
};

const removeDeadSubscription = async (endpoint) => {
  await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
};

export const sendPushToTeam = async ({ title, body, url = '/admin/orders', tag = 'team-alert' }) => {
  if (!vapidReady) return { sent: 0, failed: 0 };

  const result = await pool.query(
    `
    SELECT ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN users u ON u.id = ps.user_id
    WHERE u.role IN ('owner', 'staff')
      AND u.notifications_enabled = true
    `
  );

  if (result.rows.length === 0) return { sent: 0, failed: 0 };

  const payload = JSON.stringify({ title, body, url, tag });
  let sent = 0;
  let failed = 0;

  await Promise.all(
    result.rows.map(async (row) => {
      try {
        await webpush.sendNotification(toSubscription(row), payload);
        sent += 1;
      } catch (error) {
        failed += 1;
        if (error.statusCode === 404 || error.statusCode === 410) {
          await removeDeadSubscription(row.endpoint);
        }
        console.error('Push send error:', error.statusCode || error.message);
      }
    })
  );

  return { sent, failed };
};

/** @deprecated use sendPushToTeam */
export const sendPushToOwners = sendPushToTeam;
