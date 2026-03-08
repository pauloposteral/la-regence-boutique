import { useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, X, ArrowLeft, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useProdutos } from "@/hooks/useProdutos";
import SEOHead from "@/components/SEOHead";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import FlavorWheel from "@/components/product/FlavorWheel";

const TORRA_LABELS: Record<string, string> = {
  clara: "Clara", media: "Média", media_escura: "Média Escura", escura: "Escura",
};

const CompararPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: allProdutos = [], isLoading } = useProdutos();

  const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  const produtos = useMemo(
    () => ids.map((id) => allProdutos.find((p) => p.id === id)).filter(Boolean),
    [ids, allProdutos]
  );

  const removeProduct = (id: string) => {
    const newIds = ids.filter((i) => i !== id);
    if (newIds.length === 0) navigate("/cafes");
    else setSearchParams({ ids: newIds.join(",") });
  };

  const rows: { label: string; render: (p: any) => React.ReactNode }[] = [
    {
      label: "Imagem",
      render: (p) => {
        const img = p.imagens?.find((i: any) => i.principal)?.url || p.imagens?.[0]?.url;
        return (
          <Link to={`/cafe/${p.slug}`} className="block">
            {img ? (
              <img src={img} alt={p.nome} className="w-32 h-32 object-cover rounded-lg mx-auto" loading="lazy" />
            ) : (
              <div className="w-32 h-32 bg-secondary rounded-lg flex items-center justify-center mx-auto text-4xl">☕</div>
            )}
          </Link>
        );
      },
    },
    {
      label: "Preço",
      render: (p) => (
        <div className="text-center">
          {p.preco_promocional ? (
            <>
              <span className="line-through text-muted-foreground text-xs">R$ {p.preco.toFixed(2).replace(".", ",")}</span>
              <p className="font-display text-lg font-bold text-accent">R$ {p.preco_promocional.toFixed(2).replace(".", ",")}</p>
            </>
          ) : (
            <p className="font-display text-lg font-bold">R$ {p.preco.toFixed(2).replace(".", ",")}</p>
          )}
        </div>
      ),
    },
    { label: "Pontuação SCA", render: (p) => <span className="font-display text-xl font-bold text-accent">{p.sca_score || "—"}</span> },
    { label: "Origem", render: (p) => <span className="font-body text-sm">{p.origem || "—"}</span> },
    { label: "Variedade", render: (p) => <span className="font-body text-sm">{p.variedade || "—"}</span> },
    { label: "Processo", render: (p) => <span className="font-body text-sm">{p.processo || "—"}</span> },
    { label: "Altitude", render: (p) => <span className="font-body text-sm">{p.altitude || "—"}</span> },
    { label: "Torra", render: (p) => <span className="font-body text-sm">{p.tipo_torra ? TORRA_LABELS[p.tipo_torra] || p.tipo_torra : "—"}</span> },
    {
      label: "Notas Sensoriais",
      render: (p) =>
        p.notas_sensoriais?.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-center">
            {p.notas_sensoriais.map((n: string) => (
              <span key={n} className="text-[10px] font-body bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{n}</span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      label: "Perfil Sensorial",
      render: (p) => (
        <div className="flex justify-center">
          <FlavorWheel corpo={p.corpo} acidez={p.acidez} docura={p.docura} retrogosto={p.retrogosto} size={100} />
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <SEOHead title="Comparar Cafés | La Régence" description="Compare cafés especiais lado a lado — notas sensoriais, SCA, origem e mais." />

      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/cafes">Cafés</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Comparar</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cafes")}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold">Comparar Cafés</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-body text-muted-foreground animate-pulse">Carregando cafés…</div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-20">
            <Coffee className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="font-display text-xl mb-2">Nenhum café para comparar</p>
            <p className="font-body text-sm text-muted-foreground mb-6">Selecione cafés na página de catálogo para comparar.</p>
            <Button asChild><Link to="/cafes">Ver Cafés</Link></Button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-32" />
                  {produtos.map((p: any) => (
                    <th key={p.id} className="text-center px-4 pb-4">
                      <div className="relative">
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-destructive/10 text-destructive rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors"
                          aria-label={`Remover ${p.nome}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <Link to={`/cafe/${p.slug}`} className="font-display text-sm font-semibold hover:text-accent transition-colors">
                          {p.nome}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                    <td className="py-3 px-4 text-xs font-body font-medium text-muted-foreground uppercase tracking-wide align-middle whitespace-nowrap">
                      {row.label}
                    </td>
                    {produtos.map((p: any) => (
                      <td key={p.id} className="py-3 px-4 text-center align-middle">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default CompararPage;
