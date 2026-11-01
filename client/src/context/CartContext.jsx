import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'tss_cart';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);

  const add = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i
        );
      }
      return [
        ...prev,
        {
          _id: product._id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '',
          stock: product.stock,
          quantity: Math.min(quantity, product.stock),
        },
      ];
    });
    setOpen(true);
  };

  const update = (id, quantity) =>
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i))
    );
  const remove = (id) => setItems((prev) => prev.filter((i) => i._id !== id));
  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= 50000 ? 0 : 499;
    const tax = Math.round(subtotal * 0.18);
    return { subtotal, shipping, tax, total: subtotal + shipping + tax, count: items.reduce((s, i) => s + i.quantity, 0) };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear, totals, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
