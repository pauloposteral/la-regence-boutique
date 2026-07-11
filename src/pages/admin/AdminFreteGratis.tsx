import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const UFS = ["", "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

interface Regra {
  id: string;
  nome: string;
  uf: string | null;
  valor_minimo: number;
  prioridade: number;
  ativa: boolean;
}

const emptyRegra = { nome: "", uf: "" as string, valor_minimo: 0, prioridade: 100, ativa: true };

const AdminFreteGratis = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Regra | null>(null);
  const [form, setForm] = useState(emptyRegra);

  const { data: regras = [], isLoading } = useQuery({
    queryKey: ["admin-regras-frete"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regras_frete_gratis")
        .select("*")
        .order("prioridade", { ascending: true })
        .order("valor_minimo", { ascending: true });
      if (error) throw error;
      return (data as Regra[]) || [];
    },
  });

  const openCreate = () => { setEditing(null); setForm(emptyRegra); setOpen(true); };
  const openEdit = (r: Regra) => {
    setEditing(r);
    setForm({ nome: r.nome, uf: r.uf || "", valor_minimo: Number(r.valor_minimo), prioridade: r.prioridade, ativa: r.ativa });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Informe um nome"); return; }
    if (form.valor_minimo < 0) { toast.error("Valor mínimo inválido"); return; }
    const payload = {
      nome: form.nome.trim(),
      uf: form.uf ? form.uf.toUpperCase() : null,
      valor_minimo: Number(form.valor_minimo),
      prioridade: Number(form.prioridade) || 100,
      ativa: form.ativa,
    };
    const { error } = editing
      ? await supabase.from("regras_frete_gratis").update(payload).eq("id", editing.id)
      : await supabase.from("regras_frete_gratis").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Regra atualizada" : "Regra criada");
    qc.invalidateQueries({ queryKey: ["admin-regras-frete"] });
    setOpen(false);
  };

  const toggleAtiva = async (r: Regra) => {
    const { error } = await supabase.from("regras_frete_gratis").update({ ativa: !r.ativa }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-regras-frete"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta regra de frete grátis?")) return;
    const { error } = await supabase.from("regras_frete_gratis").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-regras-frete"] });
    toast.success("Regra excluída");
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-gold" /> Frete Grátis
          </h1>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Regras aplicadas automaticamente no carrinho e no checkout. A regra com menor valor mínimo aplicável vence.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Nova Regra
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Nome", "UF", "Valor mínimo", "Prioridade", "Status", "Ações"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regras.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-sm font-medium">{r.nome}</td>
                <td className="px-4 py-3 font-body text-sm">{r.uf || <span className="text-muted-foreground">Todas</span>}</td>
                <td className="px-4 py-3 font-body text-sm font-mono">R$ {Number(r.valor_minimo).toFixed(2).replace(".", ",")}</td>
                <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.prioridade}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAtiva(r)} className="cursor-pointer">
                    <Badge variant={r.ativa ? "default" : "secondary"} className={`font-body text-[10px] ${r.ativa ? "bg-gold/15 text-gold border-0" : ""}`}>
                      {r.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && regras.length === 0 && (
          <p className="text-center py-10 font-body text-sm text-muted-foreground">
            Nenhuma regra ainda. Clique em <span className="text-gold">Nova Regra</span> para criar a primeira.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Editar regra" : "Nova regra de frete grátis"}</DialogTitle>
            <DialogDescription className="font-body text-xs">
              Se preencher UF, a regra vale apenas para aquele estado. Se deixar em branco, vale para todo o Brasil.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label className="font-body text-xs">Nome da regra</Label>
              <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Frete grátis SP acima de R$100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-xs">UF (opcional)</Label>
                <select
                  value={form.uf}
                  onChange={(e) => set("uf", e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  {UFS.map((u) => <option key={u || "todas"} value={u}>{u || "Todas as UFs"}</option>)}
                </select>
              </div>
              <div>
                <Label className="font-body text-xs">Valor mínimo (R$)</Label>
                <Input type="number" step="0.01" min={0} value={form.valor_minimo} onChange={(e) => set("valor_minimo", +e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="font-body text-xs">Prioridade</Label>
              <Input type="number" value={form.prioridade} onChange={(e) => set("prioridade", +e.target.value)} />
              <p className="text-[10px] text-muted-foreground font-body mt-1">Menor número = maior prioridade (usada para desempate visual).</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativa} onCheckedChange={(v) => set("ativa", v)} />
              <Label className="font-body text-xs">Regra ativa</Label>
            </div>
            <Button onClick={handleSave} className="font-body text-sm">
              {editing ? "Salvar alterações" : "Criar regra"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFreteGratis;
