import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  ativa: "bg-green-100 text-green-700",
  pausada: "bg-yellow-100 text-yellow-700",
  cancelada: "bg-red-100 text-red-700",
};

const AdminAssinaturas = () => {
  const { data: subs = [] } = useQuery({
    queryKey: ["admin-assinaturas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assinaturas")
        .select("*, produtos(nome)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Assinaturas</h1>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            {["ID", "Plano", "Preço", "Moagem", "Café", "Próxima entrega", "Status"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {subs.map((s: any) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-xs font-mono">#{s.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body text-sm capitalize">{s.tipo}</td>
                <td className="px-4 py-3 font-body text-sm">R$ {Number(s.preco).toFixed(2).replace(".", ",")}</td>
                <td className="px-4 py-3 font-body text-xs">{s.moagem || "—"}</td>
                <td className="px-4 py-3 font-body text-xs">{s.cafe_surpresa ? "Surpresa" : s.produtos?.nome || "—"}</td>
                <td className="px-4 py-3 font-body text-xs">{s.proxima_entrega ? new Date(s.proxima_entrega).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={`${STATUS_COLORS[s.status] || ""} font-body text-[10px] capitalize`}>{s.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subs.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhuma assinatura</p>}
      </div>
    </div>
  );
};

export default AdminAssinaturas;
