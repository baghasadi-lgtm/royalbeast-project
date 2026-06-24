import { useState, useEffect } from 'react';
import { api } from '../api/api';
import { getQueueTrack } from '../utils/queueStorage';
import { clearKioskSession } from '../utils/kioskSession';

/** Antrian tersimpan yang masih aktif (belum selesai/dibatalkan) */
export const useActiveQueueTrack = () => {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const saved = getQueueTrack();
    if (!saved?.queueNumber) {
      setTrack(null);
      setLoading(false);
      return;
    }

    try {
      const status = await api.trackQueue(saved.queueNumber);
      if (status.isDone || status.isCancelled) {
        clearKioskSession();
        setTrack(null);
      } else {
        setTrack(saved);
      }
    } catch {
      setTrack(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { track, loading, refresh };
};
