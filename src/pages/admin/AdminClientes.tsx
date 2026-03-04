import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-700", confirmado: "bg-blue-100 text-blue-700",
  preparando: "bg-orange-100 text-orange-700", enviado: "bg-purple-100 text-purple-700",
  entregue: "bg-green-100 text-green-700", cancelado: "bg-red-100 text-red-700",
};

const AdminClientes = () => {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: allPedidos = [] } = useQuery({
    queryKey: ["admin-all-pedidos-clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("id, user_id, total, status, created_at").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = profiles.filter((p: any) =>
    (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf || "").includes(search) ||
    (p.phone || "").includes(search)
  );

  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(filtered, 20);

  const clientOrders = selectedClient
    ? allPedidos.filter((p: any) => p.user_id === selectedClient.user_id)
    : [];

  const clientTotal = clientOrders.reduce((a: number, o: any) => a + Number(o.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold">Clientes</h1>
        <span className="font-body text-xs text-muted-foreground">({profiles.length})</span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CPF, telefone…" className="pl-9 font-body text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            {["Nome", "Telefone", "CPF", "Pedidos", "Cadastro", ""].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((p: any) => {
              const orders = allPedidos.filter((o: any) => o.user_id === p.user_id);
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-body text-sm font-medium">{p.full_name || "—"}</td>
                  <td className="px-4 py-3 font-body text-sm">{p.phone || "—"}</td>
                  <td className="px-4 py-3 font-body text-sm">{p.cpf || "—"}</td>
                  <td className="px-4 py-3 font-body text-sm">{orders.length}</td>
                  <td className="px-4 py-3 font-body text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedClient(p)}><Eye className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum cliente</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{selectedClient?.full_name || "Cliente"}</DialogTitle></DialogHeader>
          {selectedClient && (
            <div className="space-y-4 font-body text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Telefone</p><p>{selectedClient.phone || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">CPF</p><p>{selectedClient.cpf || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Total de pedidos</p><p className="font-semibold">{clientOrders.length}</p></div>
                <div><p className="text-xs text-muted-foreground">Total gasto</p><p className="font-semibold text-accent">R$ {clientTotal.toFixed(2).replace(".", ",")}</p></div>
              </div>
              {clientOrders.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Histórico de pedidos</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clientOrders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                        <div>
                          <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground ml-2">{new Date(o.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${STATUS_COLORS[o.status] || ""} text-[10px] capitalize`}>{o.status}</Badge>
                          <span className="font-medium text-xs">R$ {Number(o.total).toFixed(2).replace(".", ",")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClientes;
