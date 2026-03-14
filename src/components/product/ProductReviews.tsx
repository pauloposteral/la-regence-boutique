import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  produtoId: string;
}

const SENSORY_LABELS = [
  { key: "aroma", label: "Aroma" },
  { key: "sabor", label: "Sabor" },
  { key: "finalizacao", label: "Finalização" },
] as const;

const StarRating = ({ value, onChange, size = "w-4 h-4" }: { value: number; onChange?: (v: number) => void; size?: string }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange?.(n)}
        disabled={!onChange}
        className={onChange ? "min-w-[44px] min-h-[44px] flex items-center justify-center" : ""}
      >
        <Star className={`${size} transition-colors ${n <= value ? "fill-gold text-gold" : "text-cream-400"} ${onChange ? "hover:text-gold/50 cursor-pointer" : ""}`} />
      </button>
    ))}
  </div>
);

const ProductReviews = ({ produtoId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [nota, setNota] = useState(5);
  const [titulo, setTitulo] = useState("");
  const [comentario, setComentario] = useState("");
  const [aroma, setAroma] = useState(5);
  const [sabor, setSabor] = useState(5);
  const [finalizacao, setFinalizacao] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", produtoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("produto_id", produtoId)
        .eq("aprovado", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.nota, 0) / reviews.length : 0;

  // Star breakdown
  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.nota === star).length;
    return { star, count, pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0 };
  });

  const submit = async () => {
    if (!user) { toast.error("Faça login para avaliar"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("avaliacoes").insert({
      produto_id: produtoId,
      user_id: user.id,
      nota,
      titulo: titulo.trim() || null,
      comentario: comentario.trim() || null,
      aroma,
      sabor,
      finalizacao,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar avaliação");
    } else {
      toast.success("Avaliação enviada! Será publicada após aprovação.");
      setComentario("");
      setTitulo("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["reviews", produtoId] });
    }
  };

  return (
    <div className="pt-8 border-t border-cream-400">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-brown-dark">Avaliações</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={Math.round(avgRating)} />
              <span className="font-body text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
          )}
        </div>
        {user && !showForm && (
          <Button variant="outline" size="sm" className="font-body text-xs rounded-full" onClick={() => setShowForm(true)}>
            Avaliar
          </Button>
        )}
      </div>

      {/* Star breakdown */}
      {reviews.length > 0 && (
        <div className="space-y-1.5 mb-6">
          {breakdown.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-xs font-body">
              <span className="w-4 text-right text-brown-light">{star}</span>
              <Star className="w-3 h-3 fill-gold text-gold" />
              <div className="flex-1 h-2 bg-cream-300 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right text-cream-700">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="bg-card border border-cream-400 rounded-2xl p-5 mb-6 space-y-4">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-2 block">Nota geral</label>
            <StarRating value={nota} onChange={setNota} size="w-6 h-6" />
          </div>

          {/* Sensory ratings */}
          <div className="grid grid-cols-3 gap-4">
            {SENSORY_LABELS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">{label}</label>
                <StarRating
                  value={key === "aroma" ? aroma : key === "sabor" ? sabor : finalizacao}
                  onChange={key === "aroma" ? setAroma : key === "sabor" ? setSabor : setFinalizacao}
                  size="w-4 h-4"
                />
              </div>
            ))}
          </div>

          <Input
            placeholder="Título da avaliação (opcional)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={100}
            className="font-body text-sm"
          />
          <Textarea
            placeholder="Conte sua experiência (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="font-body text-sm"
            rows={3}
            maxLength={1000}
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting} className="font-body text-xs rounded-full">
              {submitting ? "Enviando..." : "Enviar avaliação"}
            </Button>
            <Button variant="ghost" className="font-body text-xs" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 && !showForm ? (
        <p className="font-body text-sm text-muted-foreground">
          Nenhuma avaliação ainda. {user ? "Seja o primeiro a avaliar!" : "Faça login para avaliar."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-card border border-cream-400 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <StarRating value={r.nota} />
                {r.compra_verificada && (
                  <span className="text-[10px] font-body bg-gold/10 text-gold px-2 py-0.5 rounded-full">Compra verificada</span>
                )}
                <span className="text-[10px] font-body text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {r.titulo && <p className="font-body text-sm font-semibold text-brown-dark mb-1">{r.titulo}</p>}
              {r.comentario && <p className="font-body text-sm text-foreground/80 mb-2">{r.comentario}</p>}

              {/* Sensory badges */}
              {(r.aroma || r.sabor || r.finalizacao) && (
                <div className="flex gap-3 text-[10px] font-body text-cream-700">
                  {r.aroma && <span>Aroma {r.aroma}/5</span>}
                  {r.sabor && <span>Sabor {r.sabor}/5</span>}
                  {r.finalizacao && <span>Finalização {r.finalizacao}/5</span>}
                </div>
              )}

              {/* Admin response */}
              {r.resposta_admin && (
                <div className="mt-3 pl-3 border-l-2 border-gold/40">
                  <p className="text-[10px] font-body font-medium text-gold mb-0.5">Resposta La Régence</p>
                  <p className="font-body text-xs text-foreground/70">{r.resposta_admin}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
