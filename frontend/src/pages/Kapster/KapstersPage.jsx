import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../../api/api';
import { useCart } from '../../context/CartContext';
import { formatPrice, assetUrl } from '../../utils/format';
import { Loading } from '../../components/Loading';

export const KapstersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [kapsters, setKapsters] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedService = location.state?.service;

  useEffect(() => {
    if (!selectedService) {
      navigate('/services');
      return;
    }
    api.getKapstersByService(selectedService.id)
      .then(setKapsters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedService, navigate]);

  const handleSelect = (kapster) => {
    addToCart(
      {
        serviceId: selectedService.id,
        name: selectedService.name,
        duration: selectedService.duration,
        price: kapster.harga_jual || selectedService.price,
        kapsterId: kapster.id,
        kapsterName: kapster.name,
      },
      'service'
    );
    navigate('/cart');
  };

  if (loading) return <Loading />;

  return (
    <div className="page-container space-y-6">
      <div>
        <button onClick={() => navigate('/services')} className="btn-ghost mb-4 -ml-2">
          ← Kembali
        </button>
        <h2 className="section-title">Pilih Kapster</h2>
        <p className="text-sm text-muted mt-1">
          Layanan: <span className="text-ink font-medium">{selectedService?.name}</span>
        </p>
      </div>

      {kapsters.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">
          Belum ada kapster tersedia untuk layanan ini
        </div>
      ) : (
        <div className="space-y-3">
          {kapsters.map((kapster) => (
            <div key={kapster.id} className="card p-5">
              <div className="flex gap-4">
                <img
                  src={assetUrl(kapster.image)}
                  alt={kapster.name}
                  className="w-16 h-16 rounded-xl object-cover bg-surface shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-ink">{kapster.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{kapster.experience} pengalaman</p>
                  <p className="price-text text-sm mt-2">
                    {formatPrice(kapster.harga_jual || selectedService.price)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/kapster/${kapster.id}`, { state: { kapster, service: selectedService } })}
                  className="btn-secondary flex-1 py-2.5 text-xs"
                >
                  Lihat Profil
                </button>
                <button onClick={() => handleSelect(kapster)} className="btn-primary flex-1 py-2.5 text-xs">
                  Pilih
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
