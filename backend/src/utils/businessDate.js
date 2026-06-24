const TZ = 'Asia/Jakarta';

/** YYYY-MM-DD in WIB */
export const toBusinessDate = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return businessToday();
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
};

export const businessToday = () => toBusinessDate(new Date());

export const lastDayOfMonth = (yyyyMm) => {
  const [y, m] = yyyyMm.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yyyyMm}-${String(last).padStart(2, '0')}`;
};
