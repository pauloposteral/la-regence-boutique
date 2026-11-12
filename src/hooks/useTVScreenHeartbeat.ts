import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TVPlaybackSnapshot } from "@/lib/tvPlaybackPolicy";
import {
  buildReport, clearCredential, HEARTBEAT_INTERVAL_MS, loadCredential, saveCredential,
  type OfflineReport, type ScreenCredential,
} from "@/lib/tvScreenStatus";

export type PairingState = { credential: ScreenCredential | null; persistence: "persisted" | "memory" | null; rejected: boolean; lastSentAt: number | null; lastError: boolean };

/**
 * Heartbeat of this browser, only when it holds its own pairing credential.
 * Unpaired browsers play exactly as before and never call the server.
 * The secret travels only in the RPC POST body and is never logged.
 */
export function useTVScreenHeartbeat(snapshotRef: { current: TVPlaybackSnapshot | null }, offlineRef: { current: OfflineReport }, offlineModeRef: { current: boolean }) {
  const [state, setState] = useState<PairingState>(() => {
    const credential = loadCredential();
    return { credential, persistence: credential ? "persisted" : null, rejected: false, lastSentAt: null, lastError: false };
  });
  const credential = state.credential;
  const sending = useRef(false);

  const send = useCallback(async () => {
    const snapshot = snapshotRef.current;
    if (!credential || !snapshot || sending.current) return;
    sending.current = true;
    try {
      const { data, error } = await supabase.rpc("tv_report_screen", buildReport(credential, snapshot, offlineRef.current, offlineModeRef.current));
      if (error) setState(previous => ({ ...previous, rejected: error.code === "28000", lastError: true }));
      else if (data) setState(previous => ({ ...previous, rejected: false, lastError: false, lastSentAt: Date.now() }));
    } catch { setState(previous => ({ ...previous, lastError: true })); }
    finally { sending.current = false; }
  }, [credential, snapshotRef, offlineRef, offlineModeRef]);

  useEffect(() => {
    if (!credential) return;
    const first = setTimeout(() => void send(), 3_000);
    const timer = setInterval(() => void send(), HEARTBEAT_INTERVAL_MS);
    window.addEventListener("online", send);
    return () => { clearTimeout(first); clearInterval(timer); window.removeEventListener("online", send); };
  }, [credential, send]);

  const pair = useCallback((next: ScreenCredential) => {
    const persistence = saveCredential(next);
    setState({ credential: next, persistence, rejected: false, lastSentAt: null, lastError: false });
  }, []);
  const unpair = useCallback(() => { clearCredential(); setState({ credential: null, persistence: null, rejected: false, lastSentAt: null, lastError: false }); }, []);
  return { ...state, pair, unpair };
}
