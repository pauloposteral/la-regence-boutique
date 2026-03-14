// Google Analytics 4 helper
// Only fires if VITE_GA_ID is set and gtag is loaded

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

export function trackPageView(path: string, title?: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("config", GA_ID, { page_path: path, page_title: title });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("event", name, params);
}

// E-commerce events
export function trackViewItem(item: { id: string; name: string; price: number; category?: string }) {
  trackEvent("view_item", {
    currency: "BRL",
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, item_category: item.category }],
  });
}

export function trackAddToCart(item: { id: string; name: string; price: number; quantity: number }) {
  trackEvent("add_to_cart", {
    currency: "BRL",
    value: item.price * item.quantity,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }],
  });
}

export function trackBeginCheckout(value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  trackEvent("begin_checkout", {
    currency: "BRL",
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}

export function trackPurchase(transactionId: string, value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  trackEvent("purchase", {
    transaction_id: transactionId,
    currency: "BRL",
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}
