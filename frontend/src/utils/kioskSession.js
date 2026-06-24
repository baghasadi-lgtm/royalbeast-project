import { clearQueueTrack } from './queueStorage';
import { clearLastOrder } from './orderStorage';
import { resetNotificationFlags } from './notifications';

/** Reset data sesi customer di perangkat kiosk (antrian, invoice, notif flags) */
export const clearKioskSession = () => {
  clearQueueTrack();
  clearLastOrder();
  resetNotificationFlags();
};
