import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/api';
import { formatPrice, assetUrl } from '../../utils/format';
import { Loading } from '../../components/Loading';

export const KapsterProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { addToCart } = useCart();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [kapster, setKapster] = useState(location.state?.kapster);
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(!kapster);

  const selectedService = location.state?.service;

  useEffect(() => {
    if (!kapster && id) {
      api.getKapsterById(id).then(setKapster).catch(() => navigate('/services')).finally(() => setLoading(false));
    }
    if (kapster && selectedService) {
      api.getKapstersByService(selectedService.id).then((list) => {
        const match = list.find((k) => k.id === kapster.id);
        if (match) setPrice(match.harga_jual);
      });
    }
  }, [id, kapster, selectedService, navigate]);

  const handleSelect = () => {
    if (!selectedService) return navigate('/services');
    addToCart(
      {
        serviceId: selectedService.id,
        name: selectedService.name,
        duration: selectedService.duration,
        price: price || selectedService.price,
        kapsterId: kapster.id,
        kapsterName: kapster.name,
      },
      'service'
    );
    navigate('/cart');
  };

  if (loading) return <Loading />;
  if (!kapster) return null;

  return (
    <div className="page-container space-y-6">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        ← Kembali
      </button>

      <div className="card overflow-hidden">
        <div className="bg-gradient-elegant p-8 flex flex-col items-center text-center">
          <img src={assetUrl(kapster.image)} alt={kapster.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20" />
          <h2 className="text-xl font-light text-white mt-4">{kapster.name}</h2>
          <p className="text-white/60 text-sm mt-1">{kapster.experience} pengalaman</p>
          {kapster.bio && <p className="text-white/50 text-xs mt-3 max-w-xs">{kapster.bio}</p>}
        </div>

        <div className="p-5">
          {kapster.gender && (
            <p className="text-xs text-muted mb-3">
              {kapster.gender}{kapster.age ? `, ${kapster.age} tahun` : ''}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-5">
            {(kapster.services || []).map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-surface text-muted border border-line">
                {s}
              </span>
            ))}
          </div>

          {(kapster.portfolio || []).length > 0 && (
            <div>
              <h4 className="label-text mb-3">Portofolio</h4>
              <div className="grid grid-cols-2 gap-2">
                {kapster.portfolio.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMedia({ ...item, url: assetUrl(item.url) })}
                    className="relative rounded-xl overflow-hidden aspect-video bg-surface"
                  >
                    {item.type === 'image' ? (
                      <img src={assetUrl(item.url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-ink/90">
                        <Play className="text-white" size={28} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedService && (
            <div className="mt-5 pt-5 border-t border-line flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">{selectedService.name}</p>
                <p className="price-text">{formatPrice(price || selectedService.price)}</p>
              </div>
              <button onClick={handleSelect} className="btn-primary py-2.5">
                Pilih Kapster
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMedia(null)}>
          <button className="absolute top-5 right-5 text-white" onClick={() => setSelectedMedia(null)}>
            <X size={28} />
          </button>
          {selectedMedia.type === 'image' ? (
            <img src={selectedMedia.url} alt="" className="max-w-full max-h-full object-contain" />
          ) : (
            <video src={selectedMedia.url} controls className="max-w-full max-h-full" />
          )}
        </div>
      )}
    </div>
  );
};
