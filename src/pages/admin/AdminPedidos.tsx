import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Eye, Package } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type StatusPedido = Database["public"]["Enums"]["status_pedido"];

const STATUS_COLORS: Record<StatusPedido, string> = {
  pendente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  preparando: "bg-orange-100 text-orange-700",
  enviado: "bg-purple-100 text-purple-700",
  entregue: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS: StatusPedido[] = ["pendente", "confirmado", "preparando", "enviado", "entregue", "cancelado"];

const AdminPedidos = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const { data: pedidos = [] } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pedidos")
        .select("*, itens_pedido(*, produtos(nome))")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = pedidos.filter((p: any) => {
    const matchSearch = p.id.includes(search) || (p.email_visitante || "").includes(search);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, status: StatusPedido) => {
    await supabase.from("pedidos").update({ status }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
    toast.success("Status atualizado");
  };

  const updateTracking = async (id: string, code: string) => {
    await supabase.from("pedidos").update({ codigo_rastreamento: code }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
    toast.success("Rastreamento salvo");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Pedidos</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID ou e-mail…" className="pl-9 font-body text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 font-body text-sm"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Pedido", "Data", "Total", "Status", "Ações"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-xs font-mono">#{p.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body text-sm">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-body text-sm font-medium">R$ {Number(p.total).toFixed(2).replace(".", ",")}</td>
                <td className="px-4 py-3">
                  <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v as StatusPedido)}>
                    <SelectTrigger className="h-7 w-32">
                      <Badge className={`${STATUS_COLORS[p.status as StatusPedido]} font-body text-[10px] capitalize`}>{p.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailOrder(p)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum pedido encontrado</p>}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Pedido #{detailOrder?.id.slice(0, 8)}</DialogTitle></DialogHeader>
          {detailOrder && (
            <div className="space-y-4 font-body text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Data</p><p>{new Date(detailOrder.created_at).toLocaleString("pt-BR")}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge className={`${STATUS_COLORS[detailOrder.status as StatusPedido]} capitalize`}>{detailOrder.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Subtotal</p><p>R$ {Number(detailOrder.subtotal).toFixed(2).replace(".", ",")}</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">R$ {Number(detailOrder.total).toFixed(2).replace(".", ",")}</p></div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Itens</p>
                <div className="space-y-1">
                  {(detailOrder.itens_pedido || []).map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.produtos?.nome || "Produto"} x{item.quantidade}</span>
                      <span>R$ {Number(item.subtotal).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {detailOrder.endereco_entrega && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                  <p className="text-xs">{JSON.stringify(detailOrder.endereco_entrega)}</p>
                </div>
              )}

              <div>
                <Label className="text-xs">Código de rastreamento</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    defaultValue={detailOrder.codigo_rastreamento || ""}
                    placeholder="Ex: BR123456789"
                    id="tracking-input"
                    className="text-sm"
                  />
                  <Button size="sm" className="gap-1 font-body text-xs shrink-0" onClick={() => {
                    const input = document.getElementById("tracking-input") as HTMLInputElement;
                    updateTracking(detailOrder.id, input.value);
                  }}>
                    <Package className="w-3 h-3" /> Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPedidos;
