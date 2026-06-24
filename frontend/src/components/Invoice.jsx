import React from 'react';
import { formatPrice } from '../utils/format';

const formatDate = (date) =>
  new Date(date).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Divider = () => <div className="invoice-divider" aria-hidden="true" />;

const parseItems = (cartItems) => {
  let raw = cartItems;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  return Array.isArray(raw) ? raw : [];
};

export const Invoice = ({ orderData }) => {
  const { order, totalPrice, paymentMethod, paymentStatus, queueNumber, queuePosition, estimatedWait } =
    orderData;
  const items = parseItems(order?.cart_items);
  const invoiceNo = `RB-${String(order?.id || 0).padStart(5, '0')}`;
  const createdAt = order?.created_at || new Date().toISOString();

  return (
    <div id="invoice" className="invoice">
      <div className="invoice-brand">
        <p className="invoice-brand-name">ROYAL BEAST</p>
        <p className="invoice-brand-tagline">Haircut &amp; Grooming</p>
      </div>

      <Divider />

      <div className="invoice-meta">
        <div className="invoice-meta-row">
          <span>No. Struk</span>
          <span className="invoice-meta-value">{invoiceNo}</span>
        </div>
        <div className="invoice-meta-row">
          <span>Tanggal</span>
          <span className="invoice-meta-value">{formatDate(createdAt)}</span>
        </div>
        <div className="invoice-meta-row">
          <span>Bayar</span>
          <span className="invoice-meta-value">
            {paymentMethod === 'qris' ? 'QRIS' : 'Tunai'}
            {' · '}
            {paymentStatus === 'paid' ? 'Lunas' : 'Menunggu'}
          </span>
        </div>
      </div>

      {queueNumber != null && (
        <>
          <Divider />
          <div className="invoice-queue">
            <p className="invoice-queue-label">Nomor Antrian</p>
            <p className="invoice-queue-number">#{queueNumber}</p>
            <p className="invoice-queue-sub">
              Urutan ke-{queuePosition} · Est. {estimatedWait}
            </p>
          </div>
        </>
      )}

      <Divider />

      <div className="invoice-items">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted text-center py-2">Tidak ada item</p>
        ) : (
          items.map((item, idx) => {
          const qty = item.qty || 1;
          const subtotal = item.price * qty;
          return (
            <div key={idx} className="invoice-item">
              <div className="invoice-item-head">
                <span className="invoice-item-name">{item.name}</span>
                <span className="invoice-item-price">{formatPrice(subtotal)}</span>
              </div>
              <div className="invoice-item-detail">
                <span>
                  {item.type === 'service' ? 'Jasa' : 'Produk'}
                  {item.kapsterName ? ` · ${item.kapsterName}` : ''}
                </span>
                <span>{qty}x @ {formatPrice(item.price)}</span>
              </div>
            </div>
          );
        })
        )}
      </div>

      <Divider />

      <div className="invoice-total">
        <span>TOTAL</span>
        <span className="invoice-total-amount">{formatPrice(totalPrice)}</span>
      </div>

      <Divider />

      <p className="invoice-footer">Terima kasih telah berkunjung ke Royal Beast</p>
    </div>
  );
};
