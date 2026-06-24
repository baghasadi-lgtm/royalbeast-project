import { playNotificationSound } from './notificationSound.js';

const notifiedKeys = new Set();

export const isNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const getNotificationPermission = () =>
  isNotificationSupported() ? Notification.permission : 'denied';

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
};

const vibrate = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
};

export const showQueueNotification = async ({ title, body, tag, data, sound = 'default' }) => {
  if (getNotificationPermission() !== 'granted') return false;

  const key = tag || title;
  if (notifiedKeys.has(key)) return false;
  notifiedKeys.add(key);

  const payload = {
    body,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: tag || 'royalbeast-queue',
    data,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, payload);
    } else {
      new Notification(title, payload);
    }
    vibrate();
    await playNotificationSound(sound);
    return true;
  } catch (err) {
    console.error('Notification error:', err);
    notifiedKeys.delete(key);
    return false;
  }
};

export const resetNotificationFlags = () => {
  notifiedKeys.clear();
};

export const handleQueueStatusNotifications = async (track, status) => {
  if (!track?.notifyEnabled || getNotificationPermission() !== 'granted') return;

  const base = { queueNumber: track.queueNumber };

  if (status.isYourTurn && !status.isDone && !status.isCancelled) {
    await showQueueNotification({
      title: '🎉 Giliran Anda!',
      body: `Antrian #${status.queueNumber} — silakan ke kapster ${status.kapsterName || 'Anda'}`,
      tag: `turn-${status.queueNumber}`,
      data: base,
      sound: 'turn',
    });
  } else if (status.isAlmostTurn) {
    await showQueueNotification({
      title: '⏳ Hampir Giliran!',
      body: `Antrian #${status.queueNumber} — 1 orang lagi sebelum Anda`,
      tag: `almost-${status.queueNumber}`,
      data: base,
      sound: 'almost',
    });
  } else if (status.isDone) {
    await showQueueNotification({
      title: '✅ Layanan Selesai',
      body: `Terima kasih! Antrian #${status.queueNumber} sudah selesai.`,
      tag: `done-${status.queueNumber}`,
      data: base,
      sound: 'done',
    });
  }
};

export { playNotificationSound, unlockNotificationAudio } from './notificationSound.js';
