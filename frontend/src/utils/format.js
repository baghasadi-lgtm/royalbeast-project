export const formatPrice = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const API_BASE = () => {
  const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return (import.meta.env.VITE_API_URL || `http://${defaultHost}:5001/api`).replace(/\/api\/?$/, '');
};

export const assetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${API_BASE()}${path.startsWith('/') ? path : `/${path}`}`;
};

/** QRIS default ada di frontend/public; upload custom di backend /uploads */
export const qrisImageUrl = (path) => {
  if (!path || path === '/qris.jpg') return '/qris.jpg';
  return assetUrl(path);
};

export const formatDateId = (value) => {
  if (!value) return '';
  const raw = String(value);
  const iso = raw.includes('T') ? raw.slice(0, 10) : raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return raw;
  return new Date(`${iso}T12:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const businessToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

export const PRODUCT_CATEGORIES = {
  hair_care: 'Hair Care',
  hair_stylist: 'Hair Stylist',
  skincare: 'Skincare',
  body_care: 'Body Care',
};
