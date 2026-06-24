/** Bagi hasil staf = 50% dari harga jual layanan */
export const STAFF_COMMISSION_RATE = 0.5;

export const calcStaffCommission = (hargaJual) =>
  Math.round(Number(hargaJual || 0) * STAFF_COMMISSION_RATE);
