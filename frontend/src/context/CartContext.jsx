import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item, type) => {
    if (type === 'product') {
      setCart((prev) => {
        const existing = prev.find((i) => i.type === 'product' && i.productId === item.id);
        if (existing) {
          return prev.map((i) =>
            i.cartId === existing.cartId ? { ...i, qty: i.qty + 1, price: item.price } : i
          );
        }
        return [...prev, { ...item, type, productId: item.id, qty: 1, cartId: Date.now() }];
      });
      return;
    }

    setCart((prev) => {
      const withoutService = prev.filter((i) => i.type !== 'service');
      return [...withoutService, { ...item, type, cartId: Date.now() }];
    });
  };

  const updateQty = (cartId, qty) => {
    if (qty < 1) return;
    setCart((prev) => prev.map((i) => (i.cartId === cartId ? { ...i, qty } : i)));
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const getTotalPrice = () =>
    cart.reduce((total, item) => total + item.price * (item.qty || 1), 0);

  const getServiceItem = () => cart.find((i) => i.type === 'service');

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getTotalPrice, getServiceItem, updateQty }}>
      {children}
    </CartContext.Provider>
  );
};
