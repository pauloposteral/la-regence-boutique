import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Search, SlidersHorizontal, X, ShoppingBag, AlertTriangle, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Layout from "@/components/layout/Layout";
import { useProdutos, useCategorias, type Produto } from "@/hooks/useProdutos";
import SEOHead from "@/components/SEOHead";
import { useDebounce } from "@/hooks/useDebounce";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useCart } from "@/contexts/CartContext";
import { useCompare } from "@/contexts/CompareContext";
import { toast } from "sonner";

const TORRA_LABELS: Record<string, string> = {
  clara: "Clara", media: "Média", media_escura: "Média Escura", escura: "Escura",
};

const SORT_OPTIONS = [
  { value: "destaque", label: "Destaques" },
  { value: "preco_asc", label: "Menor preço" },
  { value: "preco_desc", label: "Maior preço" },
  { value: "sca_desc", label: "Maior SCA" },
  { value: "nome", label: "A-Z" },
];

const CafesPage = () => {
  const { data: produtos = [], isLoading } = useProdutos();
  const { data: categorias = [] } = useCategorias();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState("destaque");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedNotas, setSelectedNotas] = useState<string[]>([]);
  const [selectedTorra, setSelectedTorra] = useState<string | null>(null);
  const [scaMin, setScaMin] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [priceFilterActive, setPriceFilterActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Get actual price range from products
  const actualPriceRange = useMemo(() => {
    if (produtos.length === 0) return [0, 500];
    const prices = produtos.map((p) => p.preco_promocional || p.preco);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [produtos]);

  useEffect(() => {
    if (!priceFilterActive) setPriceRange(actualPriceRange as [number, number]);
  }, [actualPriceRange, priceFilterActive]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  const allNotas = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => p.notas_sensoriais?.forEach((n) => set.add(n)));
    return Array.from(set).sort();
  }, [produtos]);

  const filtered = useMemo(() => {
    let result = [...produtos];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) => p.nome.toLowerCase().includes(q) || p.notas_sensoriais?.some((n) => n.toLowerCase().includes(q)) || p.origem?.toLowerCase().includes(q)
      );
    }
    if (selectedCategoria) result = result.filter((p) => p.categoria_id === selectedCategoria);
    if (selectedNotas.length > 0) result = result.filter((p) => selectedNotas.some((n) => p.notas_sensoriais?.includes(n)));
    if (selectedTorra) result = result.filter((p) => p.tipo_torra === selectedTorra);
    if (scaMin) result = result.filter((p) => (p.sca_score || 0) >= scaMin);
    if (priceFilterActive) {
      result = result.filter((p) => {
        const price = p.preco_promocional || p.preco;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    switch (sort) {
      case "preco_asc": result.sort((a, b) => a.preco - b.preco); break;
      case "preco_desc": result.sort((a, b) => b.preco - a.preco); break;
      case "sca_desc": result.sort((a, b) => (b.sca_score || 0) - (a.sca_score || 0)); break;
      case "nome": result.sort((a, b) => a.nome.localeCompare(b.nome)); break;
      default: result.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
    }
    return result;
  }, [produtos, debouncedSearch, selectedCategoria, selectedNotas, selectedTorra, scaMin, sort, priceRange, priceFilterActive]);

  const activeFilterCount = [selectedCategoria, selectedTorra, scaMin, selectedNotas.length > 0, priceFilterActive].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategoria(null); setSelectedNotas([]); setSelectedTorra(null); setScaMin(null); setSearch("");
    setPriceFilterActive(false); setPriceRange(actualPriceRange as [number, number]);
    setVisibleCount(12);
  };

  return (
    <Layout>
      <SEOHead title="Nossos Cafés Especiais" description="Explore nossa seleção de cafés especiais com pontuação SCA 80+. Filtre por notas sensoriais, torra, origem e encontre o café perfeito." />
      
      <section className="bg-background border-b border-border py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A96E' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <p className="text-[11px] font-body tracking-[0.3em] uppercase text-gold mb-4">Coleção Completa</p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-3 text-foreground">
            Nossos <span className="italic font-light text-gradient-gold">Cafés</span>
          </h1>
          <p className="font-body text-muted-foreground max-w-md mx-auto text-sm">
            Cafés especiais torrados artesanalmente, com rastreabilidade do grão à xícara.
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0 mx-auto mt-5" />
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Cafés</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, nota sensorial, origem..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 font-body" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="font-body relative" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
              {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>}
            </Button>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] font-body"><SelectValue /></SelectTrigger>
              <SelectContent>{SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="font-body">{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-8 p-5 bg-card border border-cream-400 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Filtrar por</h3>
              {activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="font-body text-xs">Limpar filtros</Button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => <Badge key={c.id} variant={selectedCategoria === c.id ? "default" : "outline"} className="cursor-pointer font-body" onClick={() => setSelectedCategoria(selectedCategoria === c.id ? null : c.id)}>{c.nome}</Badge>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Tipo de Torra</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TORRA_LABELS).map(([key, label]) => <Badge key={key} variant={selectedTorra === key ? "default" : "outline"} className="cursor-pointer font-body" onClick={() => setSelectedTorra(selectedTorra === key ? null : key)}>{label}</Badge>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Notas Sensoriais</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allNotas.map((nota) => <Badge key={nota} variant={selectedNotas.includes(nota) ? "default" : "outline"} className="cursor-pointer font-body text-xs" onClick={() => setSelectedNotas(selectedNotas.includes(nota) ? selectedNotas.filter((n) => n !== nota) : [...selectedNotas, nota])}>{nota}</Badge>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">SCA mínima</label>
                <div className="flex flex-wrap gap-2">
                  {[80, 84, 86, 88].map((score) => <Badge key={score} variant={scaMin === score ? "default" : "outline"} className="cursor-pointer font-body" onClick={() => setScaMin(scaMin === score ? null : score)}>≥ {score}</Badge>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Faixa de Preço
                </label>
                <div className="px-1 pt-2">
                  <Slider
                    min={actualPriceRange[0]}
                    max={actualPriceRange[1]}
                    step={5}
                    value={priceRange}
                    onValueChange={(v) => { setPriceRange(v as [number, number]); setPriceFilterActive(true); }}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-[10px] font-body text-muted-foreground">
                    <span>R$ {priceRange[0]}</span>
                    <span>R$ {priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategoria && <Badge variant="secondary" className="font-body gap-1">{categorias.find((c) => c.id === selectedCategoria)?.nome}<X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategoria(null)} /></Badge>}
            {selectedTorra && <Badge variant="secondary" className="font-body gap-1">Torra {TORRA_LABELS[selectedTorra]}<X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTorra(null)} /></Badge>}
            {selectedNotas.map((n) => <Badge key={n} variant="secondary" className="font-body gap-1">{n}<X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedNotas(selectedNotas.filter((x) => x !== n))} /></Badge>)}
            {scaMin && <Badge variant="secondary" className="font-body gap-1">SCA ≥ {scaMin}<X className="w-3 h-3 cursor-pointer" onClick={() => setScaMin(null)} /></Badge>}
            {priceFilterActive && <Badge variant="secondary" className="font-body gap-1">R$ {priceRange[0]}–{priceRange[1]}<X className="w-3 h-3 cursor-pointer" onClick={() => { setPriceFilterActive(false); setPriceRange(actualPriceRange as [number, number]); }} /></Badge>}
          </div>
        )}

        <p className="text-sm text-muted-foreground font-body mb-6">{filtered.length} {filtered.length === 1 ? "café encontrado" : "cafés encontrados"}</p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-cream-400 animate-pulse">
                <div className="aspect-[3/4] bg-cream-200 rounded-t-xl" />
                <div className="p-5 space-y-3"><div className="h-5 bg-cream-300 rounded w-3/4" /><div className="h-3 bg-cream-300 rounded w-1/2" /><div className="h-4 bg-cream-300 rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground mb-2">Nenhum café encontrado</p>
            <p className="font-body text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
            <Button variant="outline" className="mt-4 font-body" onClick={clearFilters}>Limpar filtros</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.slice(0, visibleCount).map((produto, i) => <ProductCard key={produto.id} produto={produto} index={i} />)}
            </div>
            {visibleCount < filtered.length && (
              <div className="text-center mt-10">
                <Button variant="outline" className="font-body text-sm px-8" onClick={() => setVisibleCount((v) => v + 12)}>
                  Carregar mais cafés ({filtered.length - visibleCount} restantes)
                </Button>
              </div>
            )}
          </>
        )}

        {/* Floating Compare Bar */}
        <CompareBar />
      </div>
    </Layout>
  );
};

function CompareBar() {
  const { compareIds, clearCompare, goToCompare } = useCompare();
  if (compareIds.length === 0) return null;
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-card border border-gold/30 text-foreground rounded-full px-6 py-3 shadow-xl shadow-gold/10 flex items-center gap-4"
    >
      <GitCompareArrows className="w-4 h-4 text-gold" />
      <span className="font-body text-sm font-medium">{compareIds.length} café{compareIds.length > 1 ? "s" : ""} selecionado{compareIds.length > 1 ? "s" : ""}</span>
      <Button size="sm" className="font-body text-xs h-7 bg-gold text-primary-foreground hover:bg-gold-light rounded-full" onClick={goToCompare} disabled={compareIds.length < 2}>
        Comparar
      </Button>
      <button onClick={clearCompare} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function ProductCard({ produto, index }: { produto: Produto; index: number }) {
  const pixPrice = produto.preco_promocional || produto.preco * 0.9;
  const { addItem, openCart } = useCart();
  const { toggleCompare, isComparing } = useCompare();
  const comparing = isComparing(produto.id);
  const lowStock = produto.estoque > 0 && produto.estoque <= 5;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      precoPromocional: produto.preco_promocional || undefined,
      quantidade: 1,
      imagemUrl: produto.imagens?.find((i) => i.principal)?.url || produto.imagens?.[0]?.url,
      slug: produto.slug,
    });
    toast.success(`${produto.nome} adicionado ao carrinho`, {
      action: { label: "Ver carrinho", onClick: () => openCart() },
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.3) }}>
      <Link to={`/cafe/${produto.slug}`} className="group block bg-card rounded-lg overflow-hidden border border-border hover:border-gold/25 hover:shadow-lg hover:shadow-gold/5 transition-all duration-500">
        <div className="aspect-[3/4] bg-secondary flex items-center justify-center relative overflow-hidden">
          {produto.imagens && produto.imagens.length > 0 ? (
            <img src={produto.imagens.find((i) => i.principal)?.url || produto.imagens[0]?.url} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <span className="text-6xl group-hover:scale-110 transition-transform duration-500">☕</span>
          )}
          {produto.sca_score && <div className="absolute top-3 right-3 bg-gold text-primary-foreground text-[10px] font-mono font-semibold px-2.5 py-1 rounded-sm flex items-center gap-1"><Star className="w-3 h-3 fill-current" />SCA {produto.sca_score}</div>}
          {produto.destaque && <div className="absolute top-3 left-3 bg-gold/20 text-gold text-[10px] font-body font-semibold px-2.5 py-1 rounded-sm border border-gold/30">Destaque</div>}
          {produto.preco_promocional && <div className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-body font-bold px-2.5 py-1 rounded">{Math.round((1 - produto.preco_promocional / produto.preco) * 100)}% OFF</div>}
          {lowStock && (
            <div className="absolute bottom-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-body font-semibold px-2 py-1 rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Últimas {produto.estoque} un.
            </div>
          )}
        </div>
        <div className="p-5">
          {produto.categoria && <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">{produto.categoria.nome}</span>}
          <h3 className="font-display text-xl font-semibold mt-1 group-hover:text-gold transition-colors duration-300">{produto.nome}</h3>
          {produto.notas_sensoriais && produto.notas_sensoriais.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {produto.notas_sensoriais.map((nota) => <span key={nota} className="text-[10px] font-body text-gold/70 border border-gold/20 px-2 py-0.5 rounded-sm bg-gold/5">{nota}</span>)}
            </div>
          )}
          {produto.origem && <p className="text-xs text-muted-foreground font-body mt-2">{produto.origem}</p>}
          <div className="mt-4 flex items-end justify-between">
            <div>
              {produto.preco_promocional ? (
                <><span className="text-xs text-muted-foreground font-body line-through">R$ {produto.preco.toFixed(2).replace(".", ",")}</span><span className="block font-mono font-bold text-lg text-foreground">R$ {produto.preco_promocional.toFixed(2).replace(".", ",")}</span></>
              ) : (
                <span className="font-mono font-bold text-lg text-foreground">R$ {produto.preco.toFixed(2).replace(".", ",")}</span>
              )}
            </div>
            <span className="text-[10px] text-gold font-body font-medium">R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1 font-body text-xs bg-gold text-primary-foreground hover:bg-gold-light rounded-none tracking-wide uppercase transition-all duration-300"
              onClick={handleQuickAdd}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
              Adicionar
            </Button>
            <Button
              variant={comparing ? "secondary" : "outline"}
              size="sm"
              className="font-body text-xs px-2.5 border-border hover:border-gold/30"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(produto.id); }}
              title="Comparar"
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default CafesPage;
