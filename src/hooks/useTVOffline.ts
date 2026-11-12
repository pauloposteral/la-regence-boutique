import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TVVideo } from "@/lib/tvPlaylist";
import { offlineMediaKey } from "@/lib/tvOffline";
import { createOfflineStore, UNAVAILABLE_STATUS, type OfflineStatus, type OfflineStore } from "@/lib/tvOfflineStore";

/**
 * Offline program for the public /video page. A successful public fetch (including
 * an empty one) is committed before any warming; failures keep the last good program.
 * `avoidKeys` (current/upcoming sources) only defers a download, never changes the target set.
 */
export function useTVOffline({ data, isSuccess, dataUpdatedAt, avoidUrls = [] }: { data: TVVideo[] | undefined; isSuccess: boolean; dataUpdatedAt: number; avoidUrls?: readonly string[] }, storeOverride?: OfflineStore) {
  const store = useMemo(() => storeOverride ?? createOfflineStore(), [storeOverride]);
  const [status, setStatus] = useState<OfflineStatus>(UNAVAILABLE_STATUS);
  const [loaded, setLoaded] = useState(false);
  const warming = useRef(false);
  const avoid = useRef<string[]>([]);
  avoid.current = avoidUrls.map(url => offlineMediaKey(url, window.location.origin)).filter((key): key is string => !!key);

  const refresh = useCallback(async () => { setStatus(await store.status()); }, [store]);
  const warm = useCallback(async () => {
    if (warming.current) return;
    warming.current = true;
    try {
      for (let i = 0; i < 12; i++) {
        const outcome = await store.warmOnce(avoid.current);
        await refresh();
        if (outcome !== "downloaded") break;
      }
    } finally { warming.current = false; }
  }, [store, refresh]);

  useEffect(() => {
    let active = true;
    void (async () => { await store.reconcile(); const next = await store.status(); if (active) { setStatus(next); setLoaded(true); } })();
    return () => { active = false; };
  }, [store]);

  useEffect(() => {
    if (!isSuccess || !data) return;
    let active = true;
    void (async () => {
      await store.commit(data);
      if (!active) return;
      await refresh();
      void warm();
    })();
    return () => { active = false; };
  }, [store, data, isSuccess, dataUpdatedAt, refresh, warm]);

  const retry = useCallback(async () => { await store.clearFailures(); void warm(); }, [store, warm]);
  return { status, loaded, retry };
}
