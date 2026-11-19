import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem('cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // items look like: { product: {id, name, price, stock, image_url}, quantity }
  const [items, setItems] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  function addToCart(product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, product, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
  }

  function setQuantity(productId, quantity) {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.product.stock)) }
          : i
      )
    );
  }

  function removeFromCart(productId) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, total, addToCart, setQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
