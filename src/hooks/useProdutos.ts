import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Produto = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  descricao_sensorial: string | null;
  notas_sensoriais: string[] | null;
  sca_score: number | null;
  variedade: string | null;
  processo: string | null;
  origem: string | null;
  altitude: string | null;
  safra: string | null;
  tipo_torra: string | null;
  corpo: number | null;
  acidez: number | null;
  docura: number | null;
  retrogosto: number | null;
  preco: number;
  preco_promocional: number | null;
  estoque: number;
  destaque: boolean;
  categoria_id: string | null;
  categoria?: { nome: string; slug: string } | null;
  imagens?: { url: string; alt_text: string | null; principal: boolean }[];
};

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, categorias(nome, slug), produto_imagens(url, alt_text, principal)")
        .eq("ativo", true)
        .order("destaque", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        categoria: p.categorias,
        imagens: p.produto_imagens || [],
      })) as Produto[];
    },
  });
}

export function useProdutoBySlug(slug: string) {
  return useQuery({
    queryKey: ["produto", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, categorias(nome, slug), produto_imagens(url, alt_text, principal, ordem), variantes(id, moagem, peso, preco, estoque)")
        .eq("slug", slug)
        .eq("ativo", true)
        .single();

      if (error) throw error;

      return {
        ...data,
        categoria: (data as any).categorias,
        imagens: (data as any).produto_imagens || [],
        variantes: (data as any).variantes || [],
      } as Produto & { variantes: any[] };
    },
    enabled: !!slug,
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("ativo", true)
        .order("ordem");

      if (error) throw error;
      return data || [];
    },
  });
}
