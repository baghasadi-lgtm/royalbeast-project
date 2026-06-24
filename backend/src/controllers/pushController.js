import {
  getVapidPublicKey,
  isPushEnabled,
  savePushSubscription,
  removePushSubscription,
  removeAllPushSubscriptions,
  sendPushToTeam,
} from '../services/pushService.js';

export const getPublicKey = (req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(503).json({ error: 'Push notification belum dikonfigurasi di server' });
  }
  res.json({ publicKey, enabled: isPushEnabled() });
};

export const subscribe = async (req, res) => {
  try {
    if (!isPushEnabled()) {
      return res.status(503).json({ error: 'Push notification belum dikonfigurasi di server' });
    }

    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Subscription wajib diisi' });
    }

    await savePushSubscription(req.user.id, subscription, req.headers['user-agent'] || null);
    res.json({ message: 'Push notification aktif untuk perangkat ini' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan subscription' });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await removePushSubscription(req.user.id, endpoint);
    } else {
      await removeAllPushSubscriptions(req.user.id);
    }
    res.json({ message: 'Push notification dinonaktifkan' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ error: 'Gagal unsubscribe' });
  }
};

export const testPush = async (req, res) => {
  try {
    if (!isPushEnabled()) {
      return res.status(503).json({ error: 'Push notification belum dikonfigurasi di server' });
    }

    const result = await sendPushToTeam({
      title: 'Royal Beast — Tes Notifikasi',
      body: 'Push notification berhasil dikonfigurasi.',
      tag: 'team-test',
      url: '/admin/orders',
    });

    res.json({ message: 'Tes push dikirim', ...result });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ error: 'Gagal mengirim tes push' });
  }
};
