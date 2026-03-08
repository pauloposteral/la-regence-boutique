import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PREFETCH_MAP: Record<string, string[]> = {
  "/": ["/cafes", "/assinatura"],
  "/cafes": ["/checkout"],
  "/assinatura": ["/auth"],
};

/**
 * Prefetch likely next routes based on current path.
 * Uses modulepreload link hints for Vite lazy chunks.
 */
export function usePrefetchRoutes() {
  const { pathname } = useLocation();

  useEffect(() => {
    const routes = PREFETCH_MAP[pathname];
    if (!routes) return;

    const timeout = setTimeout(() => {
      routes.forEach((route) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = route;
        link.as = "document";
        // Only add if not already present
        if (!document.querySelector(`link[rel="prefetch"][href="${route}"]`)) {
          document.head.appendChild(link);
        }
      });
    }, 2000); // Wait 2s after page load

    return () => clearTimeout(timeout);
  }, [pathname]);
}
