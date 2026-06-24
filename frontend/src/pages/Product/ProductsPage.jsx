import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../../api/api';
import { useCart } from '../../context/CartContext';
import { formatPrice, PRODUCT_CATEGORIES } from '../../utils/format';
import { Loading } from '../../components/Loading';

const CATEGORIES = Object.keys(PRODUCT_CATEGORIES);

export const ProductsPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts({ kiosk: 'true' })
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === 'all' ? products : products.filter((p) => p.category === category);

  if (loading) return <Loading />;

  return (
    <div className="page-container space-y-6">
      <div>
        <button onClick={() => navigate('/')} className="btn-ghost mb-4 -ml-2">
          ← Kembali
        </button>
        <h2 className="section-title">Katalog Produk</h2>
        <p className="text-sm text-muted mt-1">Pilih produk perawatan yang tersedia</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
            category === 'all' ? 'bg-ink text-white' : 'bg-white border border-line text-muted hover:text-ink'
          }`}
        >
          Semua
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              category === cat ? 'bg-ink text-white' : 'bg-white border border-line text-muted hover:text-ink'
            }`}
          >
            {PRODUCT_CATEGORIES[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product) => {
          const available = product.status === 'available' && product.stock > 0;
          return (
            <div key={product.id} className={`card overflow-hidden ${!available ? 'opacity-50' : ''}`}>
              <div className="aspect-square bg-surface relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                {!available && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="badge-unavailable">Habis</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted">{PRODUCT_CATEGORIES[product.category]}</p>
                <h3 className="font-medium text-sm text-ink mt-0.5 line-clamp-1">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="price-text text-sm">{formatPrice(product.price)}</span>
                  {available && (
                    <span className="badge-available text-[10px]">Stok {product.stock}</span>
                  )}
                </div>
                {available && (
                  <button
                    onClick={() => addToCart(product, 'product')}
                    className="btn-primary w-full mt-3 py-2 text-xs"
                  >
                    <Plus size={14} />
                    Tambah
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center text-muted text-sm">Tidak ada produk di kategori ini</div>
      )}
    </div>
  );
};
