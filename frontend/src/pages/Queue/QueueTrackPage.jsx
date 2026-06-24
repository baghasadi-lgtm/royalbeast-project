import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, X, Printer, FileText } from 'lucide-react';
import { api } from '../../api/api';
import { useQueueTracker } from '../../hooks/useQueueTracker';
import { saveQueueTrack, getQueueTrack } from '../../utils/queueStorage';
import { clearKioskSession } from '../../utils/kioskSession';
import { getSocket, joinQueueRoom } from '../../utils/socket';
import { Invoice } from '../../components/Invoice';
import { Loading } from '../../components/Loading';

const STATUS_MAP = {
  pending: { label: 'Menunggu', className: 'badge-pending' },
  ready: { label: 'Giliran Anda!', className: 'badge-available' },
  done: { label: 'Selesai', className: 'badge-available' },
  cancelled: { label: 'Dibatalkan', className: 'badge-unavailable' },
};

export const QueueTrackPage = () => {
  const navigate = useNavigate();
  const { queueNumber: paramNumber } = useParams();
  const [searchParams] = useSearchParams();
  const saved = getQueueTrack();

  const initial = paramNumber || searchParams.get('no') || saved?.queueNumber || '';
  const [input, setInput] = useState(initial);
  const [activeNumber, setActiveNumber] = useState(initial ? Number(initial) : null);
  const [receipt, setReceipt] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [paperSize, setPaperSize] = useState('80');

  const { status, loading, error, refresh } = useQueueTracker(activeNumber);

  useEffect(() => {
    if (!activeNumber) {
      setReceipt(null);
      return;
    }

    api.getReceipt(activeNumber)
      .then(setReceipt)
      .catch(() => setReceipt(null));
  }, [activeNumber, status?.orderId]);

  const handlePrint = () => {
    document.documentElement.classList.remove('receipt-58', 'receipt-80');
    document.documentElement.classList.add(`receipt-${paperSize}`);
    window.print();
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    const num = Number(input);
    if (!num) return;
    setActiveNumber(num);
    navigate(`/antrian/${num}`, { replace: true });
    if (status) {
      saveQueueTrack({
        queueNumber: num,
        orderId: status.orderId,
        serviceName: status.serviceName,
        kapsterName: status.kapsterName,
      });
    }
  };

  useEffect(() => {
    if (!activeNumber) return;
    joinQueueRoom(activeNumber);
    const socket = getSocket();
    const onUpdate = () => refresh();
    socket.on('order_status', onUpdate);
    socket.on('queue_update', onUpdate);
    return () => {
      socket.off('order_status', onUpdate);
      socket.off('queue_update', onUpdate);
    };
  }, [activeNumber, refresh]);

  useEffect(() => {
    if (!status || !activeNumber) return;
    if (status.isDone || status.isCancelled) {
      clearKioskSession();
      navigate('/', { replace: true });
      return;
    }
    saveQueueTrack({
      queueNumber: activeNumber,
      orderId: status.orderId,
      serviceName: status.serviceName,
      kapsterName: status.kapsterName,
    });
  }, [status, activeNumber, navigate]);

  return (
    <div className="page-container space-y-6 max-w-md mx-auto">
      {receipt && showInvoice && (
        <div className="print-only">
          <Invoice orderData={receipt} />
        </div>
      )}

      <div className="no-print space-y-6">
      <div>
        <button onClick={() => navigate('/')} className="btn-ghost mb-4 -ml-2">
          ← Beranda
        </button>
        <h1 className="section-title">Cek Antrian</h1>
        <p className="text-sm text-muted mt-1">Masukkan nomor antrian Anda — tanpa login</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="number"
          min="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Contoh: 5"
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary px-5">
          <Search size={18} />
        </button>
      </form>

      {!activeNumber && (
        <div className="card p-8 text-center text-muted text-sm">
          Masukkan nomor antrian dari struk pesanan Anda
        </div>
      )}

      {activeNumber && loading && <Loading text="Mencari antrian..." />}

      {activeNumber && error && (
        <div className="card p-6 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-xs text-muted mt-2">Pastikan nomor antrian benar dan masih berlaku hari ini</p>
        </div>
      )}

      {status && !status.isDone && !status.isCancelled && (
        <>
          <div className="card overflow-hidden">
            <div className={`px-6 py-8 text-center ${status.isYourTurn && !status.isDone ? 'bg-gradient-elegant' : 'bg-surface'}`}>
              <p className={`text-xs uppercase tracking-wider mb-2 ${status.isYourTurn && !status.isDone ? 'text-white/60' : 'text-muted'}`}>
                Nomor Antrian Anda
              </p>
              <p className={`text-6xl font-light tabular-nums ${status.isYourTurn && !status.isDone ? 'text-white' : 'text-ink'}`}>
                #{status.queueNumber}
              </p>
              <span className={`mt-3 inline-block ${STATUS_MAP[status.status]?.className || 'badge-pending'}`}>
                {status.isYourTurn && !status.isDone ? 'Giliran Anda!' : STATUS_MAP[status.status]?.label}
              </span>
            </div>

            <div className="p-5 space-y-3 border-t border-line">
              <Row label="Layanan" value={status.serviceName} />
              <Row label="Kapster" value={status.kapsterName || '-'} />
              {!status.isDone && !status.isCancelled && (
                <>
                  <Row label="Sedang dilayani" value={status.currentlyServing ? `#${status.currentlyServing}` : '-'} />
                  <Row label="Orang di depan" value={`${status.peopleAhead} orang`} />
                  <Row label="Estimasi tunggu" value={status.estimatedWait} />
                </>
              )}
            </div>
          </div>

          {status.isYourTurn && !status.isDone && (
            <div className="card p-4 bg-emerald-50 border-emerald-200 text-center">
              <p className="text-sm font-medium text-emerald-800">Anda sedang dipanggil — silakan menuju kursi!</p>
            </div>
          )}

          {receipt && (
            <div className="card p-5 space-y-4">
              <button
                type="button"
                onClick={() => setShowInvoice((v) => !v)}
                className="flex items-center justify-between w-full text-sm font-medium text-ink"
              >
                <span className="flex items-center gap-2">
                  <FileText size={16} />
                  Invoice / Struk
                </span>
                <span className="text-xs text-muted">{showInvoice ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>

              {showInvoice && (
                <>
                  <Invoice orderData={receipt} />
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
                    <span className="text-muted">Ukuran kertas</span>
                    <div className="flex rounded-lg border border-line overflow-hidden">
                      {['80', '58'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setPaperSize(size)}
                          className={`px-3 py-1.5 transition-colors ${
                            paperSize === size
                              ? 'bg-ink text-white'
                              : 'bg-white text-muted hover:text-ink'
                          }`}
                        >
                          {size}mm
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handlePrint} className="btn-primary w-full py-2.5 text-xs gap-1.5">
                    <Printer size={14} />
                    Cetak Struk
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={refresh} className="btn-secondary flex-1 gap-2 text-xs">
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={() => {
                clearKioskSession();
                setActiveNumber(null);
                setInput('');
                navigate('/antrian');
              }}
              className="btn-ghost gap-1 text-xs text-muted"
            >
              <X size={14} />
              Hapus
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted">{label}</span>
    <span className="text-ink font-medium">{value}</span>
  </div>
);
