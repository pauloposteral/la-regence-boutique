import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Coffee, TrendingUp, Pause, Play, XCircle, Download, Truck, MapPinOff, Send, AlertTriangle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";
import { isOverdue, formatShipBy } from "@/lib/businessDays";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  ativa: "bg-green-100 text-green-700",
  pausada: "bg-yellow-100 text-yellow-700",
  cancelada: "bg-red-100 text-red-700",
};

const AdminAssinaturas = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSituacao, setFilterSituacao] = useState<string>("all");
  const [shipTarget, setShipTarget] = useState<any>(null);
  const [transportadora, setTransportadora] = useState("");
  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [urlRastreio, setUrlRastreio] = useState("");
  const [acting, setActing] = useState(false);

  const { data: subs = [] } = useQuery({
    queryKey: ["admin-assinaturas"],
    queryFn: async () => {
      const { data } = await supabase.from("assinaturas").select("*, produtos(nome)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: ciclos = [] } = useQuery({
    queryKey: ["admin-assinatura-ciclos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assinatura_ciclos")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Ciclo mais recente de cada assinatura → base do semáforo de prazo.
  const cicloPorAssinatura = useMemo(() => {
    const map: Record<string, any> = {};
    for (const c of ciclos as any[]) if (!map[c.assinatura_id]) map[c.assinatura_id] = c;
    return map;
  }, [ciclos]);

  const situacaoDe = (s: any) => {
    if (!s.endereco_entrega) return "sem_endereco";
    const c = cicloPorAssinatura[s.id];
    if (!c) return "ok";
    if (c.status === "shipped" || c.status === "delivered") return "despachado";
    if (c.status === "problem") return "problema";
    if (c.despachar_ate && isOverdue(c.despachar_ate)) return "atrasado";
    return "a_despachar";
  };

  const filtered = useMemo(() => {
    return (subs as any[]).filter((s) => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterSituacao !== "all" && situacaoDe(s) !== filterSituacao) return false;
      return true;
    });
  }, [subs, filterStatus, filterSituacao, cicloPorAssinatura]);

  const activeSubs = (subs as any[]).filter((s) => s.status === "ativa");
  const monthlyRevenue = activeSubs.reduce((a: number, s: any) => a + Number(s.preco), 0);
  const semEndereco = activeSubs.filter((s) => !s.endereco_entrega).length;
  const atrasadas = activeSubs.filter((s) => situacaoDe(s) === "atrasado").length;

  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(filtered, 20);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("assinaturas").update({ status: status as any }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-assinaturas"] });
    toast.success(`Assinatura ${status === "ativa" ? "reativada" : status === "pausada" ? "pausada" : "cancelada"}`);
  };

  const runAction = async (body: Record<string, unknown>, okMsg: string) => {
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscription-admin", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(okMsg);
      queryClient.invalidateQueries({ queryKey: ["admin-assinaturas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-assinatura-ciclos"] });
      return true;
    } catch (e: any) {
      toast.error(e.message || "Não foi possível concluir a ação");
      return false;
    } finally {
      setActing(false);
    }
  };

  const confirmarDespacho = async () => {
    if (!transportadora.trim() || !codigoRastreio.trim()) {
      toast.error("Informe transportadora e código de rastreio");
      return;
    }
    const ciclo = cicloPorAssinatura[shipTarget.id];
    const ok = await runAction(
      { action: "ship", assinaturaId: shipTarget.id, cicloId: ciclo?.id, transportadora, codigoRastreio, urlRastreio },
      "Despacho registrado e cliente avisado por e-mail"
    );
    if (ok) {
      setShipTarget(null);
      setTransportadora(""); setCodigoRastreio(""); setUrlRastreio("");
    }
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;


  const exportCSV = () => {
    const rows = filtered.map((s: any) => ({
      id: s.id.slice(0, 8),
      plano: s.tipo,
      preco: s.preco,
      moagem: s.moagem || "—",
      cafe: s.cafe_surpresa ? "Surpresa" : s.produtos?.nome || "—",
      status: s.status,
      proxima_entrega: s.proxima_entrega ? new Date(s.proxima_entrega).toLocaleDateString("pt-BR") : "—",
      criada_em: new Date(s.created_at).toLocaleDateString("pt-BR"),
    }));
    const headers = Object.keys(rows[0] || {}).join(",");
    const csv = [headers, ...rows.map((r: any) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `assinaturas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Assinaturas</h1>
        <Button variant="outline" size="sm" className="gap-1.5 font-body text-xs" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Ativas</p><p className="font-display text-lg font-bold flex items-center gap-1"><Coffee className="w-3.5 h-3.5 text-green-600" /> {activeSubs.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Receita mensal</p><p className="font-display text-lg font-bold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-gold" /> {fmt(monthlyRevenue)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Sem endereço</p><p className="font-display text-lg font-bold flex items-center gap-1"><MapPinOff className="w-3.5 h-3.5 text-destructive" /> {semEndereco}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Prazo estourado</p><p className="font-display text-lg font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-destructive" /> {atrasadas}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><p className="font-body text-[10px] text-muted-foreground">Total</p><p className="font-display text-lg font-bold">{subs.length}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 font-body text-sm"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="pausada">Pausada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSituacao} onValueChange={setFilterSituacao}>
          <SelectTrigger className="w-48 font-body text-sm"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as situações</SelectItem>
            <SelectItem value="a_despachar">A despachar</SelectItem>
            <SelectItem value="atrasado">Prazo estourado</SelectItem>
            <SelectItem value="sem_endereco">Sem endereço</SelectItem>
            <SelectItem value="problema">Com problema</SelectItem>
            <SelectItem value="despachado">Despachado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto bg-card">
        <table className="w-full min-w-[980px]">
          <thead><tr className="border-b border-border bg-muted/50">
            {["ID", "Plano", "Preço", "Moagem", "Café", "Situação", "Despachar até", "Status", "Ações"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((s: any) => {
              const sit = situacaoDe(s);
              const ciclo = cicloPorAssinatura[s.id];
              const sitLabel: Record<string, { t: string; c: string }> = {
                sem_endereco: { t: "Sem endereço", c: "bg-red-100 text-red-700" },
                atrasado: { t: "Prazo estourado", c: "bg-red-100 text-red-700" },
                a_despachar: { t: "A despachar", c: "bg-yellow-100 text-yellow-700" },
                problema: { t: "Com problema", c: "bg-orange-100 text-orange-700" },
                despachado: { t: "Despachado", c: "bg-green-100 text-green-700" },
                ok: { t: "—", c: "bg-muted text-muted-foreground" },
              };
              return (
              <tr
                key={s.id}
                className={`border-b border-border last:border-0 hover:bg-muted/30 ${
                  sit === "atrasado" || sit === "sem_endereco" ? "bg-red-50/70" : ""
                }`}
              >
                <td className="px-4 py-3 font-body text-xs font-mono">#{s.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body text-sm capitalize">{s.tipo}</td>
                <td className="px-4 py-3 font-body text-sm">{fmt(Number(s.preco))}</td>
                <td className="px-4 py-3 font-body text-xs">{s.moagem || "—"}</td>
                <td className="px-4 py-3 font-body text-xs">{s.cafe_surpresa ? "Surpresa" : s.produtos?.nome || "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={`${sitLabel[sit].c} font-body text-[10px]`}>{sitLabel[sit].t}</Badge>
                </td>
                <td className="px-4 py-3 font-body text-xs">{ciclo?.despachar_ate ? formatShipBy(ciclo.despachar_ate) : "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={`${STATUS_COLORS[s.status] || ""} font-body text-[10px] capitalize`}>{s.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {sit === "sem_endereco" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={acting}
                        onClick={() => runAction({ action: "request_address", assinaturaId: s.id }, "Pedido de endereço enviado ao cliente")}
                        title="Pedir endereço ao cliente">
                        <MapPinOff className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                    {(sit === "a_despachar" || sit === "atrasado" || sit === "problema") && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={acting}
                        onClick={() => setShipTarget(s)} title="Marcar como despachado">
                        <Truck className="w-3 h-3 text-gold" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={acting}
                      onClick={() => runAction({ action: "resend_confirmation", assinaturaId: s.id }, "Confirmação reenviada")}
                      title="Reenviar confirmação">
                      <Send className="w-3 h-3 text-brown" />
                    </Button>
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
            );})}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhuma assinatura</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      {/* Registrar despacho */}
      <Dialog open={!!shipTarget} onOpenChange={(o) => !o && setShipTarget(null)}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Registrar despacho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-body text-xs">Transportadora *</Label>
              <Input className="font-body text-sm" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} placeholder="Correios, Jadlog…" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-xs">Código de rastreio *</Label>
              <Input className="font-body text-sm" value={codigoRastreio} onChange={(e) => setCodigoRastreio(e.target.value)} placeholder="AA123456789BR" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-xs">Link de rastreio</Label>
              <Input className="font-body text-sm" value={urlRastreio} onChange={(e) => setUrlRastreio(e.target.value)} placeholder="https://…" />
            </div>
            <p className="font-body text-xs text-muted-foreground">O cliente recebe o e-mail com o rastreio assim que você confirmar.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full font-body text-xs" onClick={() => setShipTarget(null)} disabled={acting}>Cancelar</Button>
            <Button className="rounded-full bg-gold text-white hover:bg-gold-dark font-body text-xs" onClick={confirmarDespacho} disabled={acting}>
              {acting ? "Enviando…" : "Confirmar despacho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminAssinaturas;
