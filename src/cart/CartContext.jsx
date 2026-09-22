import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/* eslint-disable react-refresh/only-export-components */

const CartCtx = createContext(null);
const WishCtx = createContext(null);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => load("dt_cart", []));
  const [wishlist, setWishlist] = useState(() => load("dt_wishlist", []));

  useEffect(() => {
    try { localStorage.setItem("dt_cart", JSON.stringify(items)); } catch { /* full */ }
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem("dt_wishlist", JSON.stringify(wishlist)); } catch { /* full */ }
  }, [wishlist]);

  // item: { key, garment_id, garment_name, base_price, estimate, image?, sel, title, design_id? }
  const addToCart = useCallback((item) => {
    const key = item.key || `${item.garment_id}-${Date.now()}`;
    setItems((prev) => {
      const found = prev.find((x) => x.key === key);
      if (found) return prev.map((x) => (x.key === key ? { ...x, qty: (x.qty || 1) + 1 } : x));
      return [...prev, { ...item, key, qty: 1 }];
    });
    return key;
  }, []);

  const removeFromCart = useCallback((key) => {
    setItems((prev) => prev.filter((x) => x.key !== key));
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((x) => (x.key === key ? { ...x, qty: Math.max(1, qty) } : x)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const toggleWish = useCallback((garment) => {
    setWishlist((prev) => {
      const has = prev.some((g) => g.id === garment.id);
      return has ? prev.filter((g) => g.id !== garment.id) : [...prev, garment];
    });
  }, []);

  const cartValue = useMemo(
    () => items.reduce((s, i) => s + Number(i.estimate || i.base_price || 0) * (i.qty || 1), 0),
    [items]
  );
  const count = useMemo(() => items.reduce((s, i) => s + (i.qty || 1), 0), [items]);

  return (
    <CartCtx.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, cartValue, count }}>
      <WishCtx.Provider value={{ wishlist, toggleWish }}>{children}</WishCtx.Provider>
    </CartCtx.Provider>
  );
}

export function useCart() {
  const v = useContext(CartCtx);
  if (!v) throw new Error("useCart must be inside CartProvider");
  return v;
}

export function useWishlist() {
  const v = useContext(WishCtx);
  if (!v) throw new Error("useWishlist must be inside CartProvider");
  return v;
}
