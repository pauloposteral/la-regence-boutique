import { safeNext } from "./authRules";

export function oauthCallback(origin: string, next: string): string {
  const url = new URL("/auth", origin);
  url.searchParams.set("next", safeNext(next));
  return url.href;
}

export function callbackError(search: string, hash: string): string | null {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return query.get("error_description") || fragment.get("error_description") || query.get("error") || fragment.get("error");
}

/** Destination only, never tokens. URL fallback also works with restricted Safari storage. */
export function storeOAuthNext(storage: Pick<Storage, "setItem">, next: string): void {
  try { storage.setItem("auth_next", safeNext(next)); } catch { /* callback query preserves destination */ }
}

export function consumeOAuthNext(storage: Pick<Storage, "getItem" | "removeItem">, fallback: string): string {
  try {
    const next = storage.getItem("auth_next");
    storage.removeItem("auth_next");
    return safeNext(next, safeNext(fallback));
  } catch { return safeNext(fallback); }
}