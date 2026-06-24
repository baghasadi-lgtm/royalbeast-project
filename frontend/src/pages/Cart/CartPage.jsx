import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, getTotalPrice, updateQty } = useCart();

  if (cart.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
          <ShoppingBag size={24} className="text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-muted text-sm">Keranjang masih kosong</p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Mulai Pesan
        </button>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
          ← Kembali
        </button>
        <h2 className="section-title">Keranjang</h2>
      </div>

      <div className="space-y-3">
        {cart.map((item) => (
          <div key={item.cartId} className="card p-4 flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    {item.type === 'service' ? 'Jasa' : 'Barang'}
                  </p>
                  <h3 className="font-medium text-ink">{item.name}</h3>
                  {item.kapsterName && (
                    <p className="text-xs text-muted mt-0.5">Kapster: {item.kapsterName}</p>
                  )}
                  {item.duration && (
                    <p className="text-xs text-muted">{item.duration}</p>
                  )}
                </div>
                <button onClick={() => removeFromCart(item.cartId)} className="text-muted hover:text-red-500 p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                {item.type === 'product' ? (
                  <div className="flex items-center gap-3 border border-line rounded-lg">
                    <button onClick={() => updateQty(item.cartId, item.qty - 1)} className="p-2 hover:bg-surface">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm tabular-nums w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.cartId, item.qty + 1)} className="p-2 hover:bg-surface">
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <div />
                )}
                <span className="price-text">
                  {formatPrice(item.price * (item.qty || 1))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-4 sticky bottom-4">
        <div className="flex justify-between items-center">
          <span className="text-muted text-sm">Total</span>
          <span className="text-xl font-light text-ink tabular-nums">{formatPrice(getTotalPrice())}</span>
        </div>
        <button onClick={() => navigate('/checkout')} className="btn-primary w-full">
          Lanjut ke Pembayaran
        </button>
      </div>
    </div>
  );
};
