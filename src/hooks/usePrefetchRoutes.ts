import { useEffect, useCallback } from "react";
const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  "/cafes": () => import("@/pages/CafesPage"),
  "/cafe": () => import("@/pages/ProdutoPage"),
  "/checkout": () => import("@/pages/CheckoutPage"),
  "/assinatura": () => import("@/pages/AssinaturaPage"),
  "/auth": () => import("@/pages/AuthPage"),
};

const prefetched = new Set<string>();

function prefetchRoute(route: string) {
  const key = route.startsWith("/cafe/") ? "/cafe" : route.split(/[?#]/)[0];
  const load = ROUTE_LOADERS[key];
  if (!load || prefetched.has(key)) return;
  prefetched.add(key);
  void load().catch(() => prefetched.delete(key));
}

/**
 * Warm actual route modules only on pointer/keyboard navigation intent.
 */
export function usePrefetchRoutes() {
  useEffect(() => {
    const handler = (e: Event) => {
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href?.startsWith("/") && !href.startsWith("//")) {
        prefetchRoute(href);
      }
    };
    document.addEventListener("mouseover", handler, { passive: true });
    document.addEventListener("focusin", handler);
    return () => { document.removeEventListener("mouseover", handler); document.removeEventListener("focusin", handler); };
  }, []);
}

/** Imperative prefetch for specific routes */
export function usePrefetchOnHover(route: string) {
  return useCallback(() => prefetchRoute(route), [route]);
}
