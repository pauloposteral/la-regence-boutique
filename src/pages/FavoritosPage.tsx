import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const FavoritosPage = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const { data: favoritos = [], isLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("favoritos")
        .select("*, produtos(id, nome, slug, preco, preco_promocional, estoque, produto_imagens(url, principal))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const removeFavorite = async (id: string) => {
    await supabase.from("favoritos").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["favoritos"] });
    queryClient.invalidateQueries({ queryKey: ["fav-count"] });
    toast.success("Removido dos favoritos");
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-display text-2xl mb-2">Faça login para ver seus favoritos</p>
          <Button asChild variant="outline"><Link to="/auth">Entrar</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Meus Favoritos" description="Seus cafés favoritos salvos na La Régence." />
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Favoritos</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="font-display text-3xl font-semibold mb-8">Meus Favoritos</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                <div className="aspect-square bg-muted rounded-t-lg" />
                <div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : favoritos.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-display text-2xl text-muted-foreground mb-2">Nenhum favorito ainda</p>
            <p className="font-body text-sm text-muted-foreground mb-6">Explore nossos cafés e salve os que você mais gosta.</p>
            <Button asChild variant="outline"><Link to="/cafes">Ver Cafés</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritos.map((fav: any) => {
              const p = fav.produtos;
              if (!p) return null;
              const img = p.produto_imagens?.find((i: any) => i.principal)?.url || p.produto_imagens?.[0]?.url;
              return (
                <div key={fav.id} className="bg-card rounded-lg border border-border overflow-hidden">
                  <Link to={`/cafe/${p.slug}`} className="block aspect-square bg-secondary relative">
                    {img ? <img src={img} alt={p.nome} className="w-full h-full object-cover" loading="lazy" /> : <span className="flex w-full h-full items-center justify-center text-5xl">☕</span>}
                  </Link>
                  <div className="p-4">
                    <Link to={`/cafe/${p.slug}`} className="font-display text-lg font-semibold hover:text-gold transition-colors duration-300">{p.nome}</Link>
                    <p className="font-mono font-bold text-foreground mt-1">R$ {Number(p.preco_promocional || p.preco).toFixed(2).replace(".", ",")}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 font-body text-xs bg-gold text-primary-foreground hover:bg-gold-light rounded-none uppercase tracking-wide"
                        disabled={p.estoque === 0}
                        onClick={() => {
                          addItem({ produtoId: p.id, nome: p.nome, preco: p.preco, precoPromocional: p.preco_promocional || undefined, quantidade: 1, imagemUrl: img, slug: p.slug });
                          toast.success(`${p.nome} adicionado ao carrinho!`);
                        }}
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" /> {p.estoque === 0 ? "Indisponível" : "Comprar"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFavorite(fav.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritosPage;
