import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { api } from '../../api/api';
import { formatPrice } from '../../utils/format';
import { Loading } from '../../components/Loading';

export const ServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getServices()
      .then(setServices)
      .catch((err) => setError(err.message || 'Gagal memuat layanan'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="page-container space-y-4">
        <button onClick={() => navigate('/')} className="btn-ghost mb-4 -ml-2">
          ← Kembali
        </button>
        <div className="card p-6 text-center space-y-3">
          <p className="text-sm text-red-600">Gagal memuat layanan</p>
          <p className="text-xs text-muted">{error}</p>
          <p className="text-xs text-muted">
            Pastikan HP dan komputer satu WiFi, backend jalan, dan CORS_ORIGINS di backend sudah berisi IP frontend.
          </p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="page-container space-y-4">
        <button onClick={() => navigate('/')} className="btn-ghost mb-4 -ml-2">
          ← Kembali
        </button>
        <div className="card p-6 text-center text-sm text-muted">Belum ada layanan tersedia</div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <div>
        <button onClick={() => navigate('/')} className="btn-ghost mb-4 -ml-2">
          ← Kembali
        </button>
        <h2 className="section-title">Pilih Layanan</h2>
        <p className="text-sm text-muted mt-1">Pilih jenis layanan yang Anda inginkan</p>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => navigate('/kapsters', { state: { service } })}
            className="card-hover w-full p-5 flex items-center justify-between text-left group"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-ink">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-muted mt-0.5 line-clamp-1">{service.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="price-text text-sm">{formatPrice(service.price)}</span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <Clock size={12} />
                  {service.duration}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted group-hover:text-ink transition-colors shrink-0 ml-3" />
          </button>
        ))}
      </div>
    </div>
  );
};
