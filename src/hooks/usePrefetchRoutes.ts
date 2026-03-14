import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

const PREFETCH_MAP: Record<string, string[]> = {
  "/": ["/cafes", "/assinatura"],
  "/cafes": ["/checkout"],
  "/assinatura": ["/auth"],
};

const prefetched = new Set<string>();

function prefetchRoute(route: string) {
  if (prefetched.has(route)) return;
  prefetched.add(route);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = route;
  link.as = "document";
  document.head.appendChild(link);
}

/**
 * Prefetch likely next routes based on current path (automatic)
 * + exposes hover-based prefetch for links.
 */
export function usePrefetchRoutes() {
  const { pathname } = useLocation();

  useEffect(() => {
    const routes = PREFETCH_MAP[pathname];
    if (!routes) return;
    const timeout = setTimeout(() => routes.forEach(prefetchRoute), 2000);
    return () => clearTimeout(timeout);
  }, [pathname]);

  // Hover-based prefetch for product links
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("/cafe/") && !prefetched.has(href)) {
        prefetchRoute(href);
      }
    };
    document.addEventListener("mouseover", handler, { passive: true });
    return () => document.removeEventListener("mouseover", handler);
  }, []);
}

/** Imperative prefetch for specific routes */
export function usePrefetchOnHover(route: string) {
  return useCallback(() => prefetchRoute(route), [route]);
}
