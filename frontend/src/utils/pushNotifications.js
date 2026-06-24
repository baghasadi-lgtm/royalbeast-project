import { api } from '../api/api';
import {
  unlockNotificationAudio,
  requestNotificationPermission,
  isNotificationSupported,
} from './notifications';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData], (c) => c.charCodeAt(0));
};

export const isBrowserNotificationSupported = isNotificationSupported;

export const isPushSupported = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const areNotificationsEnabled = () => {
  try {
    const saved = localStorage.getItem('rb_user');
    if (!saved) return true;
    const user = JSON.parse(saved);
    return user.notificationsEnabled !== false;
  } catch {
    return true;
  }
};

const mapPushSubscribeError = (err) => {
  const msg = err?.message || String(err);
  if (/push service not available|registration failed/i.test(msg)) {
    return new Error('Push background tidak tersedia di browser ini. Toast & suara tetap aktif.');
  }
  return err instanceof Error ? err : new Error(msg);
};

export const getPushSubscription = async () => {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
};

const subscribePushInternal = async () => {
  if (!isPushSupported()) return null;

  const { publicKey } = await api.getVapidPublicKey();
  const reg = await navigator.serviceWorker.ready;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await api.subscribePush(subscription.toJSON());
  return subscription;
};

/** Aktifkan notifikasi browser + push (jika bisa) */
export const enableNotifications = async () => {
  if (!isBrowserNotificationSupported()) {
    throw new Error('Browser tidak mendukung notifikasi');
  }

  await unlockNotificationAudio();
  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error('Izin notifikasi ditolak');
  }

  if (isPushSupported()) {
    try {
      await subscribePushInternal();
    } catch (err) {
      const mapped = mapPushSubscribeError(err);
      console.warn('Push subscribe skipped:', mapped.message);
    }
  }

  return true;
};

export const disableNotifications = async () => {
  if (!isPushSupported()) return;

  const subscription = await getPushSubscription();
  if (subscription) {
    await api.unsubscribePush(subscription.endpoint);
    await subscription.unsubscribe();
  }
};

export const subscribePush = enableNotifications;
export const unsubscribePush = disableNotifications;
