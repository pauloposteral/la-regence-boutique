import { useEffect, useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TVVideo } from "@/lib/tvPlaylist";

export function useTVVideos(admin = false, enabled = true) {
  const queryClient = useQueryClient();
  const instanceId = useId();
  const audience = admin ? "admin" : "public";
  const result = useQuery({
    queryKey: ["tv-videos", audience],
    queryFn: async () => {
      let query = supabase.from("tv_videos").select("*")
        .order("sort_order").order("id");
      if (!admin) query = query.eq("active", true).is("archived_at", null);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((video): TVVideo => ({
        ...video,
        source_type: video.source_type === "youtube" ? "youtube" : "file",
        fit: video.fit === "cover" ? "cover" : "contain",
      }));
    },
    enabled,
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (!active) return;
      // Fetch the complete ordered list, including removals, using this
      // audience's existing filters instead of applying event payloads.
      void queryClient.invalidateQueries({ queryKey: ["tv-videos", audience], exact: true });
    };
    const scheduleRefresh = () => {
      if (!active || refreshTimer !== undefined) return;
      // A fixed window batches order updates without postponing the refresh
      // indefinitely while more events arrive.
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        refresh();
      }, 250);
    };
    const channel = supabase
      .channel(`tv-videos:${audience}:${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tv_videos" }, scheduleRefresh)
      .subscribe(status => {
        if (!active || status !== "SUBSCRIBED") return;
        if (refreshTimer !== undefined) {
          clearTimeout(refreshTimer);
          refreshTimer = undefined;
        }
        // Reconcile both the initial connection and later reconnections.
        refresh();
      });

    return () => {
      active = false;
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [audience, enabled, instanceId, queryClient]);

  return result;
}
