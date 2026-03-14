import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  produtoId: string;
  varianteId?: string;
  nome: string;
  moagem?: string;
  peso?: number;
  preco: number;
  precoPromocional?: number;
  quantidade: number;
  imagemUrl?: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (produtoId: string, varianteId?: string) => void;
  updateQuantity: (produtoId: string, varianteId: string | undefined, quantidade: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  cupom: string | null;
  desconto: number;
  setCupom: (code: string | null) => void;
  setDesconto: (value: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "laregence_cart";
const getKey = (produtoId: string, varianteId?: string) => `${produtoId}-${varianteId || "default"}`;

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);
  const [isOpen, setIsOpen] = useState(false);
  const [cupom, setCupom] = useState<string | null>(null);
  const [desconto, setDesconto] = useState(0);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Price validation on cart open
  const lastValidation = useRef(0);
  const validatePrices = useCallback(async (currentItems: CartItem[]) => {
    if (currentItems.length === 0) return;
    const now = Date.now();
    if (now - lastValidation.current < 30000) return; // throttle 30s
    lastValidation.current = now;
    try {
      const productIds = [...new Set(currentItems.map((i) => i.produtoId))];
      const { data: produtos } = await supabase.from("produtos").select("id, preco, preco_promocional").in("id", productIds);
      const variantIds = currentItems.map((i) => i.varianteId).filter(Boolean) as string[];
      const { data: variantes } = variantIds.length > 0
        ? await supabase.from("variantes").select("id, preco").in("id", variantIds)
        : { data: [] };

      const prodMap = new Map((produtos || []).map((p) => [p.id, p]));
      const varMap = new Map((variantes || []).map((v) => [v.id, v]));
      let updated = false;

      setItems((prev) =>
        prev.map((item) => {
          const prod = prodMap.get(item.produtoId);
          const variant = item.varianteId ? varMap.get(item.varianteId) : null;
          const newPreco = variant?.preco ?? prod?.preco ?? item.preco;
          const newPromo = prod?.preco_promocional ?? undefined;
          if (newPreco !== item.preco || newPromo !== item.precoPromocional) {
            updated = true;
            return { ...item, preco: newPreco, precoPromocional: newPromo };
          }
          return item;
        })
      );
      if (updated) toast.info("Alguns preços foram atualizados no seu carrinho.");
    } catch { /* silent */ }
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
    validatePrices(items);
  }, [items, validatePrices]);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: CartItem) => {
    // Optimistic: update state immediately, no async
    setItems((prev) => {
      const key = getKey(item.produtoId, item.varianteId);
      const existing = prev.find((i) => getKey(i.produtoId, i.varianteId) === key);
      if (existing) {
        return prev.map((i) =>
          getKey(i.produtoId, i.varianteId) === key
            ? { ...i, quantidade: i.quantidade + item.quantidade }
            : i
        );
      }
      return [...prev, item];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((produtoId: string, varianteId?: string) => {
    const key = getKey(produtoId, varianteId);
    setItems((prev) => prev.filter((i) => getKey(i.produtoId, i.varianteId) !== key));
  }, []);

  const updateQuantity = useCallback((produtoId: string, varianteId: string | undefined, quantidade: number) => {
    if (quantidade <= 0) {
      removeItem(produtoId, varianteId);
      return;
    }
    const key = getKey(produtoId, varianteId);
    setItems((prev) =>
      prev.map((i) => (getKey(i.produtoId, i.varianteId) === key ? { ...i, quantidade } : i))
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setCupom(null);
    setDesconto(0);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const subtotal = items.reduce((acc, i) => acc + (i.precoPromocional || i.preco) * i.quantidade, 0);
  const totalItems = items.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity, clearCart,
        subtotal, totalItems, cupom, desconto, setCupom, setDesconto,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
