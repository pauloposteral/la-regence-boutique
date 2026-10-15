import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TVVideo } from "@/lib/tvPlaylist";

export function useTVVideos(admin = false, enabled = true) {
  return useQuery({
    queryKey: ["tv-videos", admin ? "admin" : "public"],
    queryFn: async () => {
      let query = supabase.from("tv_videos").select("*").is("archived_at", null)
        .order("sort_order").order("id");
      if (!admin) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((video): TVVideo => ({
        ...video,
        source_type: video.source_type === "youtube" ? "youtube" : "file",
        fit: video.fit === "cover" ? "cover" : "contain",
      }));
    },
    enabled,
    refetchInterval: admin ? false : 60_000,
    refetchOnReconnect: true,
  });
}
