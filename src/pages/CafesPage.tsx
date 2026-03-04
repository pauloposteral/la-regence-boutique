import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import { useProdutos, useCategorias, type Produto } from "@/hooks/useProdutos";
import SEOHead from "@/components/SEOHead";

const TORRA_LABELS: Record<string, string> = {
  clara: "Clara",
  media: "Média",
  media_escura: "Média Escura",
  escura: "Escura",
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

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("destaque");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedNotas, setSelectedNotas] = useState<string[]>([]);
  const [selectedTorra, setSelectedTorra] = useState<string | null>(null);
  const [scaMin, setScaMin] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Extract all unique sensory notes
  const allNotas = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => p.notas_sensoriais?.forEach((n) => set.add(n)));
    return Array.from(set).sort();
  }, [produtos]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...produtos];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.notas_sensoriais?.some((n) => n.toLowerCase().includes(q)) ||
          p.origem?.toLowerCase().includes(q)
      );
    }

    if (selectedCategoria) {
      result = result.filter((p) => p.categoria_id === selectedCategoria);
    }

    if (selectedNotas.length > 0) {
      result = result.filter((p) =>
        selectedNotas.some((n) => p.notas_sensoriais?.includes(n))
      );
    }

    if (selectedTorra) {
      result = result.filter((p) => p.tipo_torra === selectedTorra);
    }

    if (scaMin) {
      result = result.filter((p) => (p.sca_score || 0) >= scaMin);
    }

    // Sort
    switch (sort) {
      case "preco_asc":
        result.sort((a, b) => a.preco - b.preco);
        break;
      case "preco_desc":
        result.sort((a, b) => b.preco - a.preco);
        break;
      case "sca_desc":
        result.sort((a, b) => (b.sca_score || 0) - (a.sca_score || 0));
        break;
      case "nome":
        result.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      default:
        result.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
    }

    return result;
  }, [produtos, search, selectedCategoria, selectedNotas, selectedTorra, scaMin, sort]);

  const activeFilterCount = [selectedCategoria, selectedTorra, scaMin, selectedNotas.length > 0].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategoria(null);
    setSelectedNotas([]);
    setSelectedTorra(null);
    setScaMin(null);
    setSearch("");
  };

  return (
    <Layout>
      <SEOHead
        title="Nossos Cafés Especiais"
        description="Explore nossa seleção de cafés especiais com pontuação SCA 80+. Filtre por notas sensoriais, torra, origem e encontre o café perfeito."
      />
      {/* Hero */}
      <section className="bg-gradient-espresso text-primary-foreground py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="font-display text-4xl lg:text-5xl font-light mb-3">
            Nossos <span className="italic font-medium text-gold">Cafés</span>
          </h1>
          <p className="font-body text-primary-foreground/60 max-w-md mx-auto">
            Cafés especiais torrados artesanalmente, com rastreabilidade do grão à xícara.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 py-10">
        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, nota sensorial, origem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 font-body"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="font-body relative"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="font-body">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 p-5 bg-card border border-border rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Filtrar por</h3>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="font-body text-xs">
                  Limpar filtros
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Categoria */}
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => (
                    <Badge
                      key={c.id}
                      variant={selectedCategoria === c.id ? "default" : "outline"}
                      className="cursor-pointer font-body"
                      onClick={() => setSelectedCategoria(selectedCategoria === c.id ? null : c.id)}
                    >
                      {c.nome}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Torra */}
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Tipo de Torra
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TORRA_LABELS).map(([key, label]) => (
                    <Badge
                      key={key}
                      variant={selectedTorra === key ? "default" : "outline"}
                      className="cursor-pointer font-body"
                      onClick={() => setSelectedTorra(selectedTorra === key ? null : key)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notas sensoriais */}
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Notas Sensoriais
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allNotas.map((nota) => (
                    <Badge
                      key={nota}
                      variant={selectedNotas.includes(nota) ? "default" : "outline"}
                      className="cursor-pointer font-body text-xs"
                      onClick={() =>
                        setSelectedNotas(
                          selectedNotas.includes(nota)
                            ? selectedNotas.filter((n) => n !== nota)
                            : [...selectedNotas, nota]
                        )
                      }
                    >
                      {nota}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* SCA mínimo */}
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Pontuação SCA mínima
                </label>
                <div className="flex flex-wrap gap-2">
                  {[80, 84, 86, 88].map((score) => (
                    <Badge
                      key={score}
                      variant={scaMin === score ? "default" : "outline"}
                      className="cursor-pointer font-body"
                      onClick={() => setScaMin(scaMin === score ? null : score)}
                    >
                      ≥ {score}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active filter tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategoria && (
              <Badge variant="secondary" className="font-body gap-1">
                {categorias.find((c) => c.id === selectedCategoria)?.nome}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategoria(null)} />
              </Badge>
            )}
            {selectedTorra && (
              <Badge variant="secondary" className="font-body gap-1">
                Torra {TORRA_LABELS[selectedTorra]}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTorra(null)} />
              </Badge>
            )}
            {selectedNotas.map((n) => (
              <Badge key={n} variant="secondary" className="font-body gap-1">
                {n}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedNotas(selectedNotas.filter((x) => x !== n))} />
              </Badge>
            ))}
            {scaMin && (
              <Badge variant="secondary" className="font-body gap-1">
                SCA ≥ {scaMin}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setScaMin(null)} />
              </Badge>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground font-body mb-6">
          {filtered.length} {filtered.length === 1 ? "café encontrado" : "cafés encontrados"}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-t-lg" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground mb-2">Nenhum café encontrado</p>
            <p className="font-body text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
            <Button variant="outline" className="mt-4 font-body" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((produto, i) => (
              <ProductCard key={produto.id} produto={produto} index={i} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

function ProductCard({ produto, index }: { produto: Produto; index: number }) {
  const pixPrice = produto.preco_promocional || produto.preco * 0.9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to={`/cafe/${produto.slug}`}
        className="group block bg-card rounded-lg overflow-hidden border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
      >
        {/* Image */}
        <div className="aspect-[3/4] bg-secondary flex items-center justify-center relative overflow-hidden">
          {produto.imagens && produto.imagens.length > 0 ? (
            <img
              src={produto.imagens.find((i) => i.principal)?.url || produto.imagens[0]?.url}
              alt={produto.nome}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="text-6xl group-hover:scale-110 transition-transform duration-500">☕</span>
          )}

          {/* SCA badge */}
          {produto.sca_score && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-body font-semibold px-2.5 py-1 rounded flex items-center gap-1">
              <Star className="w-3 h-3 fill-gold text-gold" />
              SCA {produto.sca_score}
            </div>
          )}

          {/* Destaque badge */}
          {produto.destaque && (
            <div className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-body font-semibold px-2.5 py-1 rounded">
              Destaque
            </div>
          )}

          {/* Promo badge */}
          {produto.preco_promocional && (
            <div className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-body font-bold px-2.5 py-1 rounded">
              {Math.round((1 - produto.preco_promocional / produto.preco) * 100)}% OFF
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          {produto.categoria && (
            <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
              {produto.categoria.nome}
            </span>
          )}

          <h3 className="font-display text-xl font-semibold mt-1 group-hover:text-accent transition-colors">
            {produto.nome}
          </h3>

          {/* Sensory notes */}
          {produto.notas_sensoriais && produto.notas_sensoriais.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {produto.notas_sensoriais.map((nota) => (
                <span
                  key={nota}
                  className="text-[10px] font-body bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
                >
                  {nota}
                </span>
              ))}
            </div>
          )}

          {/* Origin */}
          {produto.origem && (
            <p className="text-xs text-muted-foreground font-body mt-2">{produto.origem}</p>
          )}

          {/* Price */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              {produto.preco_promocional ? (
                <>
                  <span className="text-xs text-muted-foreground font-body line-through">
                    R$ {produto.preco.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="block font-body font-bold text-lg text-foreground">
                    R$ {produto.preco_promocional.toFixed(2).replace(".", ",")}
                  </span>
                </>
              ) : (
                <span className="font-body font-bold text-lg text-foreground">
                  R$ {produto.preco.toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>
            <span className="text-[10px] text-accent font-body font-medium">
              R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default CafesPage;
