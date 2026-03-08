import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Eye, Package, Download, Bell, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";
import AddressDisplay from "@/components/admin/AddressDisplay";
import type { Database } from "@/integrations/supabase/types";

type StatusPedido = Database["public"]["Enums"]["status_pedido"];

const STATUS_COLORS: Record<StatusPedido, string> = {
  pendente: "bg-yellow-900/30 text-yellow-400 border border-yellow-700/40",
  confirmado: "bg-blue-900/30 text-blue-400 border border-blue-700/40",
  preparando: "bg-orange-900/30 text-orange-400 border border-orange-700/40",
  enviado: "bg-purple-900/30 text-purple-400 border border-purple-700/40",
  entregue: "bg-green-900/30 text-green-400 border border-green-700/40",
  cancelado: "bg-red-900/30 text-red-400 border border-red-700/40",
};

const STATUS_OPTIONS: StatusPedido[] = ["pendente", "confirmado", "preparando", "enviado", "entregue", "cancelado"];

const AdminPedidos = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  const { data: pedidos = [] } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("*, itens_pedido(*, produtos(nome))").order("created_at", { ascending: false });
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, (payload) => {
        const orderNum = (payload.new as any).order_number;
        toast.info("🔔 Novo pedido recebido!", { description: orderNum ? `#${orderNum}` : `#${(payload.new as any).id?.slice(0, 8)}` });
        queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const loadStatusHistory = async (pedidoId: string) => {
    const { data } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("pedido_id", pedidoId)
      .order("created_at", { ascending: true });
    setStatusHistory(data || []);
  };

  const openDetail = async (p: any) => {
    setDetailOrder(p);
    await loadStatusHistory(p.id);
  };

  const filtered = pedidos.filter((p: any) => {
    const orderNum = p.order_number ? `#${p.order_number}` : "";
    const matchSearch = p.id.includes(search) || (p.email_visitante || "").includes(search) || orderNum.includes(search);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(filtered, 20);

  const updateStatus = async (id: string, status: StatusPedido) => {
    await supabase.from("pedidos").update({ status }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
    toast.success("Status atualizado");
    if (detailOrder?.id === id) loadStatusHistory(id);
  };

  const updateTracking = async (id: string, code: string) => {
    await supabase.from("pedidos").update({ codigo_rastreamento: code }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
    toast.success("Rastreamento salvo");
  };

  const formatOrderId = (p: any) => p.order_number ? `#${p.order_number}` : `#${p.id.slice(0, 8)}`;

  const exportCSV = () => {
    const rows = filtered.map((p: any) => ({
      pedido: formatOrderId(p), data: new Date(p.created_at).toLocaleDateString("pt-BR"),
      status: p.status, subtotal: p.subtotal, total: p.total, email: p.email_visitante || "Logado",
    }));
    const headers = Object.keys(rows[0] || {}).join(",");
    const csv = [headers, ...rows.map((r: any) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          Pedidos <Bell className="w-4 h-4 text-gold animate-pulse" />
        </h1>
        <Button variant="outline" size="sm" className="gap-1.5 font-body text-xs" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nº, ID ou e-mail…" className="pl-9 font-body text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {paginated.map((p: any) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-xs font-mono text-gold">{formatOrderId(p)}</td>
                <td className="px-4 py-3 font-body text-sm">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-body text-sm font-medium">R$ {Number(p.total).toFixed(2).replace(".", ",")}</td>
                <td className="px-4 py-3">
                  <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v as StatusPedido)}>
                    <SelectTrigger className="h-7 w-32">
                      <Badge className={`${STATUS_COLORS[p.status as StatusPedido]} font-body text-[10px] capitalize`}>{p.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(p)}><Eye className="w-3.5 h-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum pedido encontrado</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Pedido {detailOrder && formatOrderId(detailOrder)}</DialogTitle></DialogHeader>
          {detailOrder && (
            <div className="space-y-4 font-body text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Data</p><p>{new Date(detailOrder.created_at).toLocaleString("pt-BR")}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge className={`${STATUS_COLORS[detailOrder.status as StatusPedido]} capitalize`}>{detailOrder.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Subtotal</p><p>R$ {Number(detailOrder.subtotal).toFixed(2).replace(".", ",")}</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">R$ {Number(detailOrder.total).toFixed(2).replace(".", ",")}</p></div>
                {detailOrder.metodo_pagamento && <div><p className="text-xs text-muted-foreground">Pagamento</p><p className="capitalize">{detailOrder.metodo_pagamento}</p></div>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Itens</p>
                <div className="space-y-1">
                  {(detailOrder.itens_pedido || []).map((item: any) => (
                    <div key={item.id} className="flex justify-between"><span>{item.produtos?.nome || "Produto"} x{item.quantidade}</span><span>R$ {Number(item.subtotal).toFixed(2).replace(".", ",")}</span></div>
                  ))}
                </div>
              </div>

              {/* Status History Timeline */}
              {statusHistory.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Histórico de status</p>
                  <div className="space-y-2 border-l-2 border-gold/20 pl-4 ml-1">
                    {statusHistory.map((h: any) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gold border-2 border-background" />
                        <p className="text-xs font-medium capitalize">{h.status_novo}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(h.created_at).toLocaleString("pt-BR")}
                          {h.status_anterior && <span> · de {h.status_anterior}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailOrder.endereco_entrega && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                  <AddressDisplay endereco={detailOrder.endereco_entrega} />
                </div>
              )}
              <div>
                <Label className="text-xs">Código de rastreamento</Label>
                <div className="flex gap-2 mt-1">
                  <Input defaultValue={detailOrder.codigo_rastreamento || ""} placeholder="Ex: BR123456789" id="tracking-input" className="text-sm" />
                  <Button size="sm" className="gap-1 font-body text-xs shrink-0" onClick={() => {
                    const input = document.getElementById("tracking-input") as HTMLInputElement;
                    updateTracking(detailOrder.id, input.value);
                  }}><Package className="w-3 h-3" /> Salvar</Button>
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
