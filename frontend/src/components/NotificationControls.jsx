import React, { useState } from 'react';
import { Bell, Download } from 'lucide-react';
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  unlockNotificationAudio,
  playNotificationSound,
} from '../utils/notifications';
import { setNotifyEnabled, getQueueTrack } from '../utils/queueStorage';

export const NotificationControls = ({ queueNumber, onEnabled }) => {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [enabled, setEnabled] = useState(() => getQueueTrack()?.notifyEnabled ?? false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const supported = isNotificationSupported();

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleEnableNotify = async () => {
    await unlockNotificationAudio();
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setNotifyEnabled(true);
      setEnabled(true);
      await playNotificationSound('default');
      onEnabled?.();
    }
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (!supported) {
    return (
      <p className="text-xs text-muted text-center">
        Browser ini tidak mendukung notifikasi. Gunakan Chrome atau Safari terbaru.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {permission === 'granted' && enabled ? (
        <div className="card p-4 bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <Bell size={18} className="text-emerald-600 shrink-0" />
          <div className="text-left">
            <p className="text-sm font-medium text-emerald-800">Notifikasi aktif</p>
            <p className="text-xs text-emerald-700">
              Kami akan ingatkan saat antrian #{queueNumber} hampir giliran
            </p>
          </div>
        </div>
      ) : (
        <button onClick={handleEnableNotify} className="btn-primary w-full gap-2">
          <Bell size={16} />
          Aktifkan Notifikasi Antrian
        </button>
      )}

      {permission === 'denied' && (
        <p className="text-xs text-red-600 text-center">
          Notifikasi diblokir. Aktifkan di pengaturan browser Anda.
        </p>
      )}

      {installPrompt && (
        <button onClick={handleInstallPwa} className="btn-secondary w-full gap-2 text-xs">
          <Download size={16} />
          Install App (PWA) ke Home Screen
        </button>
      )}

      {!installPrompt && enabled && (
        <p className="text-[11px] text-muted text-center">
          Tip: Install app ke home screen agar notifikasi lebih andal
        </p>
      )}
    </div>
  );
};
