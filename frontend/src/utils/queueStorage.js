const STORAGE_KEY = 'rb_queue_track';

export const saveQueueTrack = (data) => {
  const existing = getQueueTrack();
  const payload = {
    queueNumber: data.queueNumber,
    orderId: data.orderId,
    serviceName: data.serviceName || '',
    kapsterName: data.kapsterName || '',
    notifyEnabled: data.notifyEnabled ?? existing?.notifyEnabled ?? false,
    savedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
};

export const getQueueTrack = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setNotifyEnabled = (enabled) => {
  const track = getQueueTrack();
  if (!track) return null;
  track.notifyEnabled = enabled;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(track));
  return track;
};

export const clearQueueTrack = () => {
  localStorage.removeItem(STORAGE_KEY);
};
