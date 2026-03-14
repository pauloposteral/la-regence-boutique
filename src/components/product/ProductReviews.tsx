import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  produtoId: string;
}

const ProductReviews = ({ produtoId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
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

  const submit = async () => {
    if (!user) { toast.error("Faça login para avaliar"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("avaliacoes").insert({
      produto_id: produtoId,
      user_id: user.id,
      nota,
      comentario: comentario.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar avaliação");
    } else {
      toast.success("Avaliação enviada! Será publicada após aprovação.");
      setComentario("");
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
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-gold text-gold" : "text-cream-400"}`} />
                ))}
              </div>
              <span className="font-body text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
          )}
        </div>
        {user && !showForm && (
          <Button variant="outline" size="sm" className="font-body text-xs" onClick={() => setShowForm(true)}>
            Avaliar
          </Button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div className="bg-card border border-cream-400 rounded-2xl p-5 mb-6 space-y-4">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-2 block">Nota</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setNota(n)} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <Star className={`w-6 h-6 transition-colors ${n <= nota ? "fill-gold text-gold" : "text-cream-400 hover:text-gold/50"}`} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Conte sua experiência (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="font-body text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting} className="font-body text-xs">
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
          {reviews.map((r) => (
            <div key={r.id} className="bg-card border border-cream-400 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.nota ? "fill-gold text-gold" : "text-cream-400"}`} />
                  ))}
                </div>
                <span className="text-[10px] font-body text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {r.comentario && <p className="font-body text-sm text-foreground/80">{r.comentario}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
