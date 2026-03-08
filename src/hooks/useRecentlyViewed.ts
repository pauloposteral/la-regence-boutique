import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "laregence_recently_viewed";
const MAX_ITEMS = 8;

interface RecentProduct {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  imagemUrl?: string;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const addProduct = useCallback((product: RecentProduct) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentlyViewed: items, addProduct };
}
