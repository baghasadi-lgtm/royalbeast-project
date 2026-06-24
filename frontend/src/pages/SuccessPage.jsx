import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Printer } from 'lucide-react';
import { formatPrice, qrisImageUrl } from '../utils/format';
import { saveLastOrder, getLastOrder, clearLastOrder } from '../utils/orderStorage';
import { clearKioskSession } from '../utils/kioskSession';
import { getSocket } from '../utils/socket';
import { api } from '../api/api';
import { Invoice } from '../components/Invoice';
import { useCart } from '../context/CartContext';

export const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const leavingRef = useRef(false);
  const orderData = location.state?.orderData || getLastOrder();
  const [showInvoice, setShowInvoice] = useState(true);
  const [paperSize, setPaperSize] = useState('80');

  const goHome = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    clearKioskSession();
    clearLastOrder();
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!orderData) {
      navigate('/', { replace: true });
    }
  }, [orderData, navigate]);

  useEffect(() => {
    if (!orderData || leavingRef.current) return;
    clearCart();
    saveLastOrder(orderData);
  }, [orderData, clearCart]);

  const queueNumber = orderData?.queueNumber;
  const paymentMethod = orderData?.paymentMethod;
  const paymentStatus = orderData?.paymentStatus;
  const isPaid = paymentStatus === 'paid';
  const canLeave = isPaid || paymentMethod === 'cash';

  useEffect(() => {
    if (!canLeave) return;
    goHome();
  }, [canLeave, goHome]);

  useEffect(() => {
    if (!queueNumber || leavingRef.current) return;

    const checkDone = async () => {
      try {
        const status = await api.trackQueue(queueNumber);
        if (status.isDone || status.isCancelled) goHome();
      } catch {
        // ignore
      }
    };

    checkDone();
    const socket = getSocket();
    const onStatus = (payload) => {
      if (payload.queueNumber !== queueNumber) return;
      if (payload.status === 'done' || payload.status === 'cancelled') goHome();
    };
    const onPayment = (payload) => {
      if (payload.queueNumber === queueNumber || payload.orderId === orderData?.order?.id) {
        goHome();
      }
    };
    socket.on('order_status', onStatus);
    socket.on('order_payment', onPayment);
    return () => {
      socket.off('order_status', onStatus);
      socket.off('order_payment', onPayment);
    };
  }, [queueNumber, orderData?.order?.id, goHome]);

  if (!orderData) return null;

  const { totalPrice, qrisImage } = orderData;
  const showQris = paymentMethod === 'qris' && !isPaid;
  const hasQueue = queueNumber != null;

  const handlePrint = () => {
    document.documentElement.classList.remove('receipt-58', 'receipt-80');
    document.documentElement.classList.add(`receipt-${paperSize}`);
    window.print();
  };

  return (
    <div className="page-container min-h-[calc(100vh-4rem)] py-8">
      <div className="print-only">
        <Invoice orderData={orderData} />
      </div>

      <div className="no-print max-w-md mx-auto space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-600" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-light text-ink">
            {paymentMethod === 'qris' && isPaid
              ? 'Pembayaran Berhasil'
              : paymentMethod === 'cash'
                ? 'Pesanan Dibuat'
                : 'Menunggu Pembayaran QRIS'}
          </h2>
          <p className="text-sm text-muted mt-1">
            {paymentMethod === 'cash'
              ? 'Silakan bayar tunai ke staf. Pantau papan antrian di beranda.'
              : isPaid
                ? 'Kembali ke beranda...'
                : 'Scan QRIS di bawah dan bayar sesuai nominal. Staf akan konfirmasi setelah pembayaran masuk.'}
          </p>
        </div>

        {showQris && (
          <div className="card p-6 flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-ink">Bayar {formatPrice(totalPrice)}</p>
            <img
              src={qrisImageUrl(qrisImage)}
              alt="QRIS Royal Beast"
              className="w-52 h-52 object-contain rounded-lg"
            />
          </div>
        )}

        {hasQueue && (
          <div className="card p-5 bg-ink text-white text-center">
            <p className="text-[10px] uppercase tracking-wider text-white/50">Nomor Antrian Anda</p>
            <p className="text-4xl font-light tabular-nums mt-1">#{queueNumber}</p>
          </div>
        )}

        <div className="card p-5">
          <button
            type="button"
            onClick={() => setShowInvoice((v) => !v)}
            className="flex items-center justify-between w-full text-sm font-medium text-ink mb-0"
          >
            <span>Struk / Invoice</span>
            <span className="text-xs text-muted">{showInvoice ? 'Sembunyikan' : 'Tampilkan'}</span>
          </button>
          {showInvoice && (
            <div className="mt-4 pt-4 border-t border-line">
              <Invoice orderData={orderData} />
            </div>
          )}
        </div>

        <div className="no-print space-y-3">
          {showInvoice && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Ukuran kertas</span>
                <div className="flex rounded-lg border border-line overflow-hidden">
                  {['80', '58'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPaperSize(size)}
                      className={`px-3 py-1.5 transition-colors ${
                        paperSize === size ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink'
                      }`}
                    >
                      {size}mm
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={handlePrint} className="btn-secondary w-full py-2.5 text-xs gap-1.5">
                <Printer size={14} />
                Cetak Struk
              </button>
            </>
          )}
          <button type="button" onClick={goHome} className="btn-primary w-full py-2.5 text-xs">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};
