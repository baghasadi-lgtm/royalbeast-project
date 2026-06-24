import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/api';

const POLL_INTERVAL = 15000;

export const useQueueTracker = (queueNumber) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!queueNumber) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.trackQueue(queueNumber);
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [queueNumber]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, loading, error, refresh: fetchStatus };
};
