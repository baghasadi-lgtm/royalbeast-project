import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Banknote, Loader2, Clock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/api';
import { formatPrice, qrisImageUrl } from '../../utils/format';
import { clearKioskSession } from '../../utils/kioskSession';

const DEFAULT_QRIS = '/qris.jpg';

const goKioskHome = (navigate) => {
  clearKioskSession();
  navigate('/', { replace: true });
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice, getServiceItem, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [loading, setLoading] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [qrisImage, setQrisImage] = useState(DEFAULT_QRIS);
  const pollRef = useRef(null);

  useEffect(() => {
    api.getQrisSetting()
      .then((data) => setQrisImage(data.qrisImage || DEFAULT_QRIS))
      .catch(() => setQrisImage(DEFAULT_QRIS));
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  if (cart.length === 0 && !pendingOrder) {
    navigate('/cart');
    return null;
  }

  const startPaymentPolling = (orderId, orderData) => {
    setWaitingPayment(true);
    pollRef.current = setInterval(async () => {
      try {
        const status = await api.getPaymentStatus(orderId);
        if (status.payment_status === 'paid') {
          clearInterval(pollRef.current);
          clearCart();
          goKioskHome(navigate);
        }
      } catch {
        // keep polling
      }
    }, 3000);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const serviceItem = getServiceItem();
      const cartItems = cart.map((item) => ({
        ...item,
        price: item.price,
        qty: item.qty || 1,
      }));

      const data = await api.checkout({
        cartItems,
        kapsterId: serviceItem?.kapsterId || null,
        paymentMethod,
      });

      const orderData = {
        ...data,
        qrisImage: data.qrisImage || qrisImage || DEFAULT_QRIS,
      };

      if (paymentMethod === 'cash') {
        clearCart();
        goKioskHome(navigate);
        return;
      }

      if (data.paymentStatus === 'paid') {
        clearCart();
        goKioskHome(navigate);
        return;
      }

      // QRIS — tampilkan halaman menunggu konfirmasi (static/mock/gateway)
      setPendingOrder(orderData);
      clearCart();
      startPaymentPolling(data.order.id, orderData);
    } catch (error) {
      alert(error.message || 'Gagal melakukan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  if (pendingOrder && waitingPayment) {
    const items = pendingOrder.order?.cart_items || [];
    const qrisImageSrc = pendingOrder.qrisUrl || qrisImageUrl(pendingOrder.qrisImage || qrisImage);

    return (
      <div className="page-container space-y-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-amber-600" strokeWidth={2} />
          </div>
          <h2 className="section-title">Menunggu Konfirmasi</h2>
          <p className="text-sm text-muted mt-1">
            Scan QRIS dan bayar sesuai nominal. Staf akan konfirmasi setelah pembayaran masuk.
          </p>
        </div>

        {pendingOrder.queueNumber != null && (
          <div className="card p-5 text-center bg-ink text-white">
            <p className="text-[10px] uppercase tracking-wider text-white/50">Nomor Antrian</p>
            <p className="text-4xl font-light tabular-nums mt-1">#{pendingOrder.queueNumber}</p>
            <p className="text-[11px] text-white/50 mt-1">
              Urutan ke-{pendingOrder.queuePosition} · Est. {pendingOrder.estimatedWait}
            </p>
          </div>
        )}

        <div className="card p-6 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-ink">Bayar {formatPrice(pendingOrder.totalPrice)}</p>
          {pendingOrder.qrisUrl ? (
            <img src={pendingOrder.qrisUrl} alt="QRIS" className="w-56 h-56 object-contain" />
          ) : (
            <img src={qrisImageSrc} alt="QRIS Royal Beast" className="w-56 h-56 object-contain rounded-lg" />
          )}
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" />
            Menunggu konfirmasi pembayaran...
          </div>
        </div>

        <div className="card divide-y divide-line">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 flex justify-between items-start">
              <div>
                <p className="font-medium text-ink text-sm">{item.name}</p>
                {item.kapsterName && <p className="text-xs text-muted">Kapster: {item.kapsterName}</p>}
              </div>
              <span className="price-text text-sm">{formatPrice(item.price * (item.qty || 1))}</span>
            </div>
          ))}
          <div className="p-4 flex justify-between items-center bg-surface/50">
            <span className="font-medium text-ink">Total</span>
            <span className="text-lg font-light text-ink tabular-nums">{formatPrice(pendingOrder.totalPrice)}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/success', { state: { orderData: pendingOrder } })}
          className="btn-secondary w-full text-xs"
        >
          Lihat Invoice &amp; Antrian
        </button>
      </div>
    );
  }

  const qrisImageSrc = qrisImageUrl(qrisImage);

  return (
    <div className="page-container space-y-6">
      <div>
        <button onClick={() => navigate('/cart')} className="btn-ghost mb-4 -ml-2">
          ← Kembali
        </button>
        <h2 className="section-title">Konfirmasi & Bayar</h2>
      </div>

      <div className="card divide-y divide-line">
        {cart.map((item) => (
          <div key={item.cartId} className="p-4 flex justify-between items-start">
            <div>
              <p className="font-medium text-ink text-sm">{item.name}</p>
              {item.kapsterName && <p className="text-xs text-muted">Kapster: {item.kapsterName}</p>}
              {item.qty > 1 && <p className="text-xs text-muted">× {item.qty}</p>}
            </div>
            <span className="price-text text-sm">{formatPrice(item.price * (item.qty || 1))}</span>
          </div>
        ))}
        <div className="p-4 flex justify-between items-center bg-surface/50">
          <span className="font-medium text-ink">Total</span>
          <span className="text-lg font-light text-ink tabular-nums">{formatPrice(getTotalPrice())}</span>
        </div>
      </div>

      <div>
        <p className="label-text mb-3">Metode Pembayaran</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('qris')}
            className={`card p-5 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'qris' ? 'border-ink ring-1 ring-ink/10' : ''
            }`}
          >
            <QrCode size={24} className={paymentMethod === 'qris' ? 'text-ink' : 'text-muted'} strokeWidth={1.5} />
            <span className="text-sm font-medium">QRIS</span>
            <span className="text-[10px] text-muted">Scan & bayar</span>
          </button>
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`card p-5 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'cash' ? 'border-ink ring-1 ring-ink/10' : ''
            }`}
          >
            <Banknote size={24} className={paymentMethod === 'cash' ? 'text-ink' : 'text-muted'} strokeWidth={1.5} />
            <span className="text-sm font-medium">Tunai</span>
            <span className="text-[10px] text-muted">Bayar ke staf</span>
          </button>
        </div>
      </div>

      {paymentMethod === 'qris' && (
        <div className="card p-6 flex flex-col items-center gap-3">
          <img src={qrisImageSrc} alt="QRIS Royal Beast" className="w-48 h-48 object-contain rounded-lg" />
          <p className="text-xs text-muted text-center">
            Scan QR di atas dan transfer sesuai total. Staf akan konfirmasi setelah pembayaran masuk.
          </p>
        </div>
      )}

      {paymentMethod === 'cash' && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            Pesanan dibuat dulu. Bayar tunai ke staf, lalu staf konfirmasi pembayaran di sistem sebelum layanan dimulai.
          </p>
        </div>
      )}

      <button onClick={handlePay} disabled={loading} className="btn-primary w-full">
        {loading ? 'Memproses...' : paymentMethod === 'qris' ? 'Buat Pesanan & Bayar QRIS' : 'Buat Pesanan'}
      </button>
    </div>
  );
};
