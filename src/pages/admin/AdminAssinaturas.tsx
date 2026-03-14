import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coffee, TrendingUp, Pause, Play, XCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  ativa: "bg-green-100 text-green-700",
  pausada: "bg-yellow-100 text-yellow-700",
  cancelada: "bg-red-100 text-red-700",
};

const AdminAssinaturas = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: subs = [] } = useQuery({
    queryKey: ["admin-assinaturas"],
    queryFn: async () => {
      const { data } = await supabase.from("assinaturas").select("*, produtos(nome)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (filterStatus === "all") return subs;
    return subs.filter((s: any) => s.status === filterStatus);
  }, [subs, filterStatus]);

  const activeSubs = subs.filter((s: any) => s.status === "ativa");
  const monthlyRevenue = activeSubs.reduce((a: number, s: any) => a + Number(s.preco), 0);

  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(filtered, 20);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("assinaturas").update({ status: status as any }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-assinaturas"] });
    toast.success(`Assinatura ${status === "ativa" ? "reativada" : status === "pausada" ? "pausada" : "cancelada"}`);
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Assinaturas</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Ativas</p><p className="font-display text-lg font-bold flex items-center gap-1"><Coffee className="w-3.5 h-3.5 text-green-600" /> {activeSubs.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Receita mensal</p><p className="font-display text-lg font-bold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-gold" /> {fmt(monthlyRevenue)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Total</p><p className="font-display text-lg font-bold">{subs.length}</p></CardContent></Card>
      </div>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-40 font-body text-sm"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="ativa">Ativa</SelectItem>
          <SelectItem value="pausada">Pausada</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            {["ID", "Plano", "Preço", "Moagem", "Café", "Próxima entrega", "Status", "Ações"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((s: any) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-xs font-mono">#{s.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body text-sm capitalize">{s.tipo}</td>
                <td className="px-4 py-3 font-body text-sm">{fmt(Number(s.preco))}</td>
                <td className="px-4 py-3 font-body text-xs">{s.moagem || "—"}</td>
                <td className="px-4 py-3 font-body text-xs">{s.cafe_surpresa ? "Surpresa" : s.produtos?.nome || "—"}</td>
                <td className="px-4 py-3 font-body text-xs">{s.proxima_entrega ? new Date(s.proxima_entrega).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={`${STATUS_COLORS[s.status] || ""} font-body text-[10px] capitalize`}>{s.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {s.status === "ativa" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateStatus(s.id, "pausada")} title="Pausar">
                        <Pause className="w-3 h-3 text-yellow-600" />
                      </Button>
                    )}
                    {s.status === "pausada" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateStatus(s.id, "ativa")} title="Reativar">
                        <Play className="w-3 h-3 text-green-600" />
                      </Button>
                    )}
                    {s.status !== "cancelada" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                        if (confirm("Cancelar assinatura?")) updateStatus(s.id, "cancelada");
                      }} title="Cancelar">
                        <XCircle className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhuma assinatura</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>
    </div>
  );
};

export default AdminAssinaturas;
