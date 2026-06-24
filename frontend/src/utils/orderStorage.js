const STORAGE_KEY = 'rb_last_order';

export const saveLastOrder = (orderData) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...orderData, savedAt: Date.now() }));
  } catch {
    // ignore quota errors
  }
};

export const getLastOrder = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearLastOrder = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};
