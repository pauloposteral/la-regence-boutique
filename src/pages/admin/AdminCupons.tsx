import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";

const emptyCoupon = {
  codigo: "", desconto_percentual: null as number | null, desconto_valor: null as number | null,
  valor_minimo: null as number | null, usos_restantes: null as number | null,
  valido_ate: "", ativo: true,
};

const AdminCupons = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyCoupon);

  const { data: cupons = [] } = useQuery({
    queryKey: ["admin-cupons"],
    queryFn: async () => { const { data } = await supabase.from("cupons").select("*").order("created_at", { ascending: false }); return data || []; },
  });

  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(cupons, 20);

  const openCreate = () => { setEditing(null); setForm(emptyCoupon); setOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ codigo: c.codigo, desconto_percentual: c.desconto_percentual, desconto_valor: c.desconto_valor, valor_minimo: c.valor_minimo, usos_restantes: c.usos_restantes, valido_ate: c.valido_ate ? c.valido_ate.slice(0, 10) : "", ativo: c.ativo });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, valido_ate: form.valido_ate ? new Date(form.valido_ate).toISOString() : null };
    if (editing) { await supabase.from("cupons").update(payload).eq("id", editing.id); toast.success("Cupom atualizado"); }
    else { await supabase.from("cupons").insert(payload); toast.success("Cupom criado"); }
    qc.invalidateQueries({ queryKey: ["admin-cupons"] }); setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir cupom?")) return;
    await supabase.from("cupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-cupons"] }); toast.success("Cupom excluído");
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Cupons</h1>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}><Plus className="w-4 h-4" /> Novo Cupom</Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            {["Código", "Desconto", "Mín.", "Usos", "Validade", "Status", "Ações"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((c: any) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-sm font-mono font-medium">{c.codigo}</td>
                <td className="px-4 py-3 font-body text-sm">{c.desconto_percentual ? `${c.desconto_percentual}%` : c.desconto_valor ? `R$ ${Number(c.desconto_valor).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3 font-body text-sm">{c.valor_minimo ? `R$ ${Number(c.valor_minimo).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3 font-body text-sm">{c.usos_restantes ?? "∞"}</td>
                <td className="px-4 py-3 font-body text-sm">{c.valido_ate ? new Date(c.valido_ate).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3"><Badge variant={c.ativo ? "default" : "secondary"} className="font-body text-[10px]">{c.ativo ? "Ativo" : "Inativo"}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cupons.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum cupom</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Cupom" : "Novo Cupom"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label className="font-body text-xs">Código</Label><Input value={form.codigo} onChange={(e) => set("codigo", e.target.value.toUpperCase())} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="font-body text-xs">Desconto %</Label><Input type="number" value={form.desconto_percentual ?? ""} onChange={(e) => set("desconto_percentual", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Desconto R$</Label><Input type="number" step="0.01" value={form.desconto_valor ?? ""} onChange={(e) => set("desconto_valor", e.target.value ? +e.target.value : null)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="font-body text-xs">Valor mínimo</Label><Input type="number" step="0.01" value={form.valor_minimo ?? ""} onChange={(e) => set("valor_minimo", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Usos restantes</Label><Input type="number" value={form.usos_restantes ?? ""} onChange={(e) => set("usos_restantes", e.target.value ? +e.target.value : null)} /></div>
            </div>
            <div><Label className="font-body text-xs">Válido até</Label><Input type="date" value={form.valido_ate} onChange={(e) => set("valido_ate", e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} /><Label className="font-body text-xs">Ativo</Label></div>
            <Button onClick={handleSave} className="font-body text-sm">{editing ? "Salvar" : "Criar cupom"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCupons;
