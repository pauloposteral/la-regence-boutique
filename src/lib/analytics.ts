// Google Analytics 4 + Meta Pixel helper
// Auto-initializes via `initAnalytics()` if VITE_GA_ID / VITE_META_PIXEL_ID are set.
// All tracking helpers no-op when env vars are missing.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

let initialized = false;

function loadScript(src: string, async = true) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = async;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // GA4
  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      (window.dataLayer as unknown[]).push(arguments as unknown);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`).catch(() => {});
  }

  // Meta Pixel
  if (PIXEL_ID) {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any) {
      if (f.fbq) return;
      const n: any = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      const t = b.createElement(e); t.async = true; t.src = v;
      const s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq?.("init", PIXEL_ID);
    window.fbq?.("track", "PageView");
  }
}

export function trackPageView(path: string, title?: string) {
  if (GA_ID && window.gtag) {
    window.gtag("event", "page_view", { page_path: path, page_title: title, page_location: window.location.href });
  }
  if (PIXEL_ID && window.fbq) {
    window.fbq("track", "PageView");
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (GA_ID && window.gtag) window.gtag("event", name, params);
}

// E-commerce events
export function trackViewItem(item: { id: string; name: string; price: number; category?: string }) {
  trackEvent("view_item", {
    currency: "BRL",
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, item_category: item.category }],
  });
  if (PIXEL_ID && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_ids: [item.id], content_name: item.name, content_type: "product", value: item.price, currency: "BRL",
    });
  }
}

export function trackAddToCart(item: { id: string; name: string; price: number; quantity: number }) {
  trackEvent("add_to_cart", {
    currency: "BRL",
    value: item.price * item.quantity,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }],
  });
  if (PIXEL_ID && window.fbq) {
    window.fbq("track", "AddToCart", {
      content_ids: [item.id], content_name: item.name, content_type: "product",
      value: item.price * item.quantity, currency: "BRL",
    });
  }
}

export function trackBeginCheckout(value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  trackEvent("begin_checkout", {
    currency: "BRL",
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
  if (PIXEL_ID && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_ids: items.map((i) => i.id), value, currency: "BRL", num_items: items.reduce((s, i) => s + i.quantity, 0),
    });
  }
}

export function trackPurchase(transactionId: string, value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  trackEvent("purchase", {
    transaction_id: transactionId,
    currency: "BRL",
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
  if (PIXEL_ID && window.fbq) {
    window.fbq("track", "Purchase", {
      content_ids: items.map((i) => i.id), value, currency: "BRL", num_items: items.reduce((s, i) => s + i.quantity, 0),
    });
  }
}
