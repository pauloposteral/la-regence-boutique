// Shared rate limiter helper for edge functions.
// Uses the SECURITY DEFINER function `check_rate_limit` (service role only).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

let _admin: ReturnType<typeof createClient> | null = null;
function admin() {
  if (_admin) return _admin;
  _admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  return _admin;
}

/** Returns true when the request is ALLOWED. Returns false when blocked. */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const { data, error } = await admin().rpc("check_rate_limit", {
      _key: key,
      _max_requests: maxRequests,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.warn("rate_limit rpc error", error.message);
      return true; // fail-open to avoid blocking legitimate users on infra errors
    }
    return data === true;
  } catch (e) {
    console.warn("rate_limit exception", e);
    return true;
  }
}

/** Best-effort caller identifier from request headers. */
export function callerKey(req: Request, prefix: string, userId?: string | null): string {
  if (userId) return `${prefix}:user:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${prefix}:ip:${ip}`;
}
