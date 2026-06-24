import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Package } from 'lucide-react';
import { QueueSection } from '../components/QueueSection';

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container min-h-[calc(100vh-4rem)] flex flex-col gap-8 py-8">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted font-medium">Self-Service Kiosk</p>
        <h1 className="text-3xl font-light tracking-tight text-ink">Royal Beast</h1>
      </div>

      <QueueSection />

      <div>
        <p className="text-xs text-muted text-center mb-4">Pilih jenis pesanan</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/services')}
            className="group card-hover p-6 flex flex-col items-center gap-3 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-elegant flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scissors size={22} className="text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-medium text-ink text-sm">Jasa</h2>
              <p className="text-[11px] text-muted mt-0.5">Layanan & kapster</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/products')}
            className="group card-hover p-6 flex flex-col items-center gap-3 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package size={22} className="text-ink" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-medium text-ink text-sm">Barang</h2>
              <p className="text-[11px] text-muted mt-0.5">Produk perawatan</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
