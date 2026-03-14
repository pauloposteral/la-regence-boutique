import { useState, useMemo, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Minus, Plus, MapPin, Mountain, Leaf, Calendar, Coffee, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import FlavorWheel from "@/components/product/FlavorWheel";
import ProductGallery from "@/components/product/ProductGallery";
import ProductReviews from "@/components/product/ProductReviews";
import FavoriteButton from "@/components/product/FavoriteButton";
import ShareButtons from "@/components/product/ShareButtons";
import PromotionCountdown from "@/components/product/PromotionCountdown";
import StickyAddToCart from "@/components/product/StickyAddToCart";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import ShippingCalculator from "@/components/product/ShippingCalculator";
import BackInStockNotify from "@/components/product/BackInStockNotify";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProdutoBySlug, useProdutos } from "@/hooks/useProdutos";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import OptimizedImage from "@/components/ui/optimized-image";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const MOAGEM_LABELS: Record<string, string> = { graos: "Grãos", grossa: "Grossa", media: "Média", fina: "Fina", extra_fina: "Extra Fina" };
const TORRA_LABELS: Record<string, string> = { clara: "Clara", media: "Média", media_escura: "Média Escura", escura: "Escura" };

const ProdutoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: produto, isLoading, error } = useProdutoBySlug(slug || "");
  const { data: allProdutos = [] } = useProdutos();
  const { addItem, openCart } = useCart();
  const { addProduct } = useRecentlyViewed();

  const [selectedMoagem, setSelectedMoagem] = useState<string | null>(null);
  const [selectedPeso, setSelectedPeso] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  const moagens = useMemo(() => {
    if (!produto?.variantes) return [];
    const set = new Set(produto.variantes.map((v: any) => v.moagem));
    return Array.from(set) as string[];
  }, [produto]);

  const pesos = useMemo(() => {
    if (!produto?.variantes) return [];
    const filtered = selectedMoagem ? produto.variantes.filter((v: any) => v.moagem === selectedMoagem) : produto.variantes;
    const set = new Set(filtered.map((v: any) => v.peso));
    return Array.from(set).sort((a, b) => a - b) as number[];
  }, [produto, selectedMoagem]);

  useEffect(() => { if (moagens.length > 0 && !selectedMoagem) setSelectedMoagem(moagens[0]); }, [moagens]);
  useEffect(() => { if (pesos.length > 0 && !selectedPeso) setSelectedPeso(pesos[0]); }, [pesos]);

  const selectedVariant = useMemo(() => {
    if (!produto?.variantes || !selectedMoagem || !selectedPeso) return null;
    return produto.variantes.find((v: any) => v.moagem === selectedMoagem && v.peso === selectedPeso);
  }, [produto, selectedMoagem, selectedPeso]);

  const currentPrice = selectedVariant?.preco || produto?.preco || 0;
  const pixPrice = produto?.preco_promocional ? produto.preco_promocional * 0.9 : currentPrice * 0.9;

  const related = useMemo(() => {
    if (!produto) return [];
    return allProdutos.filter((p) => p.id !== produto.id).slice(0, 4);
  }, [allProdutos, produto]);

  const mainImg = produto?.imagens?.find((i: any) => i.principal)?.url || produto?.imagens?.[0]?.url;

  // Track recently viewed
  useEffect(() => {
    if (produto) {
      addProduct({ id: produto.id, nome: produto.nome, slug: produto.slug, preco: produto.preco, imagemUrl: mainImg });
    }
  }, [produto?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-pulse">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4"><div className="h-8 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /><div className="h-6 bg-muted rounded w-1/3 mt-6" /></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !produto) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="font-display text-2xl mb-4">Produto não encontrado</p>
          <Button asChild variant="outline"><Link to="/cafes">Voltar ao catálogo</Link></Button>
        </div>
      </Layout>
    );
  }

  const promoPercent = produto.preco_promocional ? Math.round((1 - produto.preco_promocional / produto.preco) * 100) : null;

  const productJsonLd = {
    "@context": "https://schema.org", "@type": "Product",
    name: produto.nome, description: produto.descricao || produto.descricao_sensorial || "", image: mainImg,
    brand: { "@type": "Brand", name: "La Régence" },
    offers: { "@type": "Offer", price: currentPrice, priceCurrency: "BRL", availability: produto.estoque > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };

  const handleAddToCart = () => {
    // Validação de estoque antes de adicionar
    const estoqueDisponivel = selectedVariant?.estoque ?? produto.estoque;
    if (quantidade > estoqueDisponivel) {
      toast.error(`Estoque insuficiente. Disponível: ${estoqueDisponivel} unidades.`);
      return;
    }
    addItem({ produtoId: produto.id, varianteId: selectedVariant?.id, nome: produto.nome, moagem: selectedMoagem || undefined, peso: selectedPeso || undefined, preco: currentPrice, precoPromocional: produto.preco_promocional || undefined, quantidade, imagemUrl: produto.imagens?.[0]?.url, slug: produto.slug });
    toast.success(
      <div className="flex items-center gap-3">
        {mainImg && <img src={mainImg} alt="" className="w-10 h-10 rounded object-cover shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{produto.nome}</p>
          <p className="text-xs text-muted-foreground">Adicionado ao carrinho</p>
        </div>
      </div>,
      {
        action: {
          label: "Ver carrinho",
          onClick: () => openCart(),
        },
        duration: 4000,
      }
    );
  };

  return (
    <Layout>
      <SEOHead title={produto.nome} description={produto.descricao_sensorial || produto.descricao || `Café especial ${produto.nome} — La Régence`} image={mainImg} type="product" jsonLd={productJsonLd} />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/cafes">Cafés</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{produto.nome}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="container mx-auto px-4 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <ProductGallery images={produto.imagens || []} productName={produto.nome} scaScore={produto.sca_score} promoPercent={promoPercent} />
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {produto.categoria && <span className="text-xs font-body text-gold uppercase tracking-[0.2em]">{produto.categoria.nome}</span>}
            <h1 className="font-display text-3xl lg:text-4xl font-semibold leading-tight">{produto.nome}</h1>

            {produto.notas_sensoriais && produto.notas_sensoriais.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {produto.notas_sensoriais.map((nota) => <Badge key={nota} variant="secondary" className="font-body text-xs">{nota}</Badge>)}
              </div>
            )}

            {/* Low stock warning */}
            {produto.estoque > 0 && produto.estoque <= 5 && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg px-4 py-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-body text-sm font-medium">Últimas {produto.estoque} unidades em estoque!</span>
              </div>
            )}

            {/* Price */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-end gap-3">
                {produto.preco_promocional ? (
                  <>
                    <span className="text-sm text-muted-foreground font-body line-through">R$ {produto.preco.toFixed(2).replace(".", ",")}</span>
                    <span className="font-display text-4xl font-bold text-foreground">R$ {(selectedVariant?.preco ? selectedVariant.preco * (produto.preco_promocional / produto.preco) : produto.preco_promocional).toFixed(2).replace(".", ",")}</span>
                  </>
                ) : (
                  <span className="font-display text-4xl font-bold text-foreground">R$ {currentPrice.toFixed(2).replace(".", ",")}</span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-4 text-sm font-body">
                  <span className="text-gold font-semibold">R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix (10% off)</span>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  ou 12x de R$ {(currentPrice / 12).toFixed(2).replace(".", ",")} sem juros
                </p>
              </div>
              {produto.preco_promocional && (
                <div className="mt-3"><PromotionCountdown /></div>
              )}
            </div>

            <p className="font-body text-muted-foreground leading-relaxed">{produto.descricao}</p>

            {/* Variant selector */}
            {moagens.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Moagem</label>
                  <div className="flex flex-wrap gap-2">
                    {moagens.map((m) => (
                      <button key={m} onClick={() => { setSelectedMoagem(m); setSelectedPeso(null); }}
                        className={`px-4 py-2 rounded border text-sm font-body transition-all ${selectedMoagem === m ? "border-gold bg-gold/10 text-foreground font-medium" : "border-border text-muted-foreground hover:border-gold/50"}`}>
                        {MOAGEM_LABELS[m] || m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Peso</label>
                  <div className="flex flex-wrap gap-2">
                    {pesos.map((p) => (
                      <button key={p} onClick={() => setSelectedPeso(p)}
                        className={`px-4 py-2 rounded border text-sm font-body transition-all ${selectedPeso === p ? "border-gold bg-gold/10 text-foreground font-medium" : "border-border text-muted-foreground hover:border-gold/50"}`}>
                        {p >= 1000 ? `${p / 1000}kg` : `${p}g`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Out of stock badge + Back in stock notify */}
            {produto.estoque === 0 && (
              <div className="space-y-3">
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-center">
                  <span className="font-body text-sm font-semibold text-destructive">Fora de estoque</span>
                </div>
                <BackInStockNotify produtoId={produto.id} produtoNome={produto.nome} />
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded">
                <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="p-2.5 hover:bg-muted transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-body text-sm">{quantidade}</span>
                <button onClick={() => { const max = selectedVariant?.estoque ?? produto.estoque; setQuantidade(Math.min(quantidade + 1, max)); }} className="p-2.5 hover:bg-muted transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                <Button className="w-full font-body text-sm tracking-wider uppercase bg-gold text-primary-foreground hover:bg-gold-light rounded-none transition-all duration-300" size="lg" disabled={produto.estoque === 0} onClick={handleAddToCart}>
                  <ShoppingBag className="w-4 h-4 mr-2" /> {produto.estoque === 0 ? "Indisponível" : "Adicionar ao Carrinho"}
                </Button>
              </motion.div>
              <FavoriteButton produtoId={produto.id} />
            </div>

            {/* Share */}
            <ShareButtons url={`/cafe/${produto.slug}`} title={produto.nome} />

            {/* Shipping calculator */}
            <ShippingCalculator />
          </motion.div>
        </div>

        {/* Tabs: Descrição / Ficha Técnica / Avaliações */}
        <div className="mt-16">
          <Tabs defaultValue="descricao" className="w-full">
            <TabsList className="w-full justify-start bg-card border border-border rounded-lg p-1 h-auto flex-wrap">
              <TabsTrigger value="descricao" className="font-body text-sm">Descrição</TabsTrigger>
              {(produto.corpo || produto.sca_score) && <TabsTrigger value="ficha" className="font-body text-sm">Ficha Técnica</TabsTrigger>}
              <TabsTrigger value="avaliacoes" className="font-body text-sm">Avaliações</TabsTrigger>
            </TabsList>

            <TabsContent value="descricao" className="mt-6 space-y-6">
              {produto.descricao_sensorial && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-2">Perfil Sensorial</h3>
                  <p className="font-body text-muted-foreground leading-relaxed italic">"{produto.descricao_sensorial}"</p>
                </div>
              )}
              {produto.corpo && produto.acidez && produto.docura && produto.retrogosto && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-4 text-center">Roda de Sabores</h3>
                  <FlavorWheel corpo={produto.corpo} acidez={produto.acidez} docura={produto.docura} retrogosto={produto.retrogosto} notas={produto.notas_sensoriais || []} />
                </div>
              )}
              {produto.descricao && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-2">Sobre este café</h3>
                  <p className="font-body text-muted-foreground leading-relaxed">{produto.descricao}</p>
                </div>
              )}
            </TabsContent>

            {(produto.corpo || produto.sca_score) && (
              <TabsContent value="ficha" className="mt-6">
                <h3 className="font-display text-lg font-semibold mb-4">Ficha Técnica</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {produto.sca_score && <SpecItem icon={<Star className="w-4 h-4 text-gold" />} label="SCA Score" value={`${produto.sca_score} pontos`} />}
                  {produto.variedade && <SpecItem icon={<Leaf className="w-4 h-4 text-gold" />} label="Variedade" value={produto.variedade} />}
                  {produto.processo && <SpecItem icon={<Coffee className="w-4 h-4 text-gold" />} label="Processo" value={produto.processo} />}
                  {produto.origem && <SpecItem icon={<MapPin className="w-4 h-4 text-gold" />} label="Origem" value={produto.origem} />}
                  {produto.altitude && <SpecItem icon={<Mountain className="w-4 h-4 text-gold" />} label="Altitude" value={produto.altitude} />}
                  {produto.safra && <SpecItem icon={<Calendar className="w-4 h-4 text-gold" />} label="Safra" value={produto.safra} />}
                  {produto.tipo_torra && <SpecItem icon={<span className="text-gold text-sm">🔥</span>} label="Torra" value={TORRA_LABELS[produto.tipo_torra] || produto.tipo_torra} />}
                </div>
              </TabsContent>
            )}

            <TabsContent value="avaliacoes" className="mt-6">
              <ProductReviews produtoId={produto.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border">
            <h2 className="font-display text-2xl lg:text-3xl font-light mb-8 text-center">Você também vai <span className="italic font-medium">gostar</span></h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <Link key={p.id} to={`/cafe/${p.slug}`} className="group block bg-card rounded-lg overflow-hidden border border-border hover:border-gold/25 hover:shadow-lg hover:shadow-gold/5 transition-all duration-500">
                  <div className="aspect-[3/4] bg-secondary flex items-center justify-center relative">
                    {p.imagens && p.imagens.length > 0 ? (
                      <OptimizedImage src={p.imagens.find((i: any) => i.principal)?.url || p.imagens[0]?.url} alt={p.nome} className="group-hover:scale-105 transition-transform duration-500" />
                    ) : <span className="text-4xl">☕</span>}
                    {p.sca_score && <div className="absolute top-2 right-2 bg-gold text-primary-foreground text-[9px] font-mono font-semibold px-2 py-0.5 rounded-sm flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-current" />{p.sca_score}</div>}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display text-sm font-semibold truncate">{p.nome}</h3>
                    <p className="text-[10px] text-muted-foreground font-body mt-0.5">{p.notas_sensoriais?.slice(0, 2).join(" · ")}</p>
                    <span className="font-body font-semibold text-sm mt-1.5 block">R$ {p.preco.toFixed(2).replace(".", ",")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        <RecentlyViewed currentProductId={produto.id} />
      </div>

      {/* Sticky add-to-cart mobile (32) */}
      <StickyAddToCart
        productName={produto.nome}
        price={currentPrice}
        pixPrice={pixPrice}
        onAddToCart={handleAddToCart}
        disabled={produto.estoque === 0}
      />
    </Layout>
  );
};

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-body font-semibold text-sm">{value}</p>
      </div>
    </div>
  );
}

export default ProdutoPage;
