import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProdutoRating = { media: number; total: number };

/**
 * Aggregated approved review ratings, keyed by produto_id.
 * Used to show star averages on product listings.
 */
export function useProdutoRatings() {
  return useQuery({
    queryKey: ["produto-ratings"],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Record<string, ProdutoRating>> => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("produto_id, nota")
        .eq("aprovado", true);

      if (error) throw error;

      const acc: Record<string, { soma: number; total: number }> = {};
      for (const row of data || []) {
        const cur = acc[row.produto_id] || { soma: 0, total: 0 };
        cur.soma += row.nota;
        cur.total += 1;
        acc[row.produto_id] = cur;
      }

      const out: Record<string, ProdutoRating> = {};
      for (const [id, { soma, total }] of Object.entries(acc)) {
        out[id] = { media: soma / total, total };
      }
      return out;
    },
  });
}
