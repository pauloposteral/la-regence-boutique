import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TipoTorra = Database["public"]["Enums"]["tipo_torra"];

const TORRA_LABELS: Record<string, string> = {
  clara: "Clara", media: "Média", media_escura: "Média Escura", escura: "Escura",
};

const emptyProduct = {
  nome: "", slug: "", descricao: "", preco: 0, preco_promocional: null as number | null,
  estoque: 0, estoque_minimo: 5, ativo: true, destaque: false,
  origem: "", variedade: "", processo: "", altitude: "", safra: "",
  sca_score: null as number | null, tipo_torra: "media" as TipoTorra,
  notas_sensoriais: [] as string[], descricao_sensorial: "",
  acidez: null as number | null, corpo: null as number | null,
  docura: null as number | null, retrogosto: null as number | null,
  peso_padrao: 250,
};

const AdminProdutos = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyProduct);
  const [notasInput, setNotasInput] = useState("");

  const { data: produtos = [] } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("*, produto_imagens(url, principal)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = produtos.filter((p: any) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setNotasInput("");
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      nome: p.nome, slug: p.slug, descricao: p.descricao || "", preco: p.preco,
      preco_promocional: p.preco_promocional, estoque: p.estoque, estoque_minimo: p.estoque_minimo,
      ativo: p.ativo, destaque: p.destaque, origem: p.origem || "", variedade: p.variedade || "",
      processo: p.processo || "", altitude: p.altitude || "", safra: p.safra || "",
      sca_score: p.sca_score, tipo_torra: p.tipo_torra || "media",
      notas_sensoriais: p.notas_sensoriais || [], descricao_sensorial: p.descricao_sensorial || "",
      acidez: p.acidez, corpo: p.corpo, docura: p.docura, retrogosto: p.retrogosto,
      peso_padrao: p.peso_padrao || 250,
    });
    setNotasInput((p.notas_sensoriais || []).join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const notas = notasInput.split(",").map((s) => s.trim()).filter(Boolean);
    const slug = form.slug || form.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...form, slug, notas_sensoriais: notas };

    if (editing) {
      const { error } = await supabase.from("produtos").update(payload).eq("id", editing.id);
      if (error) return toast.error("Erro ao atualizar");
      toast.success("Produto atualizado");
    } else {
      const { error } = await supabase.from("produtos").insert(payload);
      if (error) return toast.error("Erro ao criar: " + error.message);
      toast.success("Produto criado");
    }
    queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("produtos").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
    toast.success("Produto excluído");
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Produtos</h1>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo Produto
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar produto…" className="pl-9 font-body text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Produto", "Preço", "Estoque", "Status", "Ações"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => {
              const img = p.produto_imagens?.find((i: any) => i.principal)?.url || p.produto_imagens?.[0]?.url;
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center text-lg">☕</span>}
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium">{p.nome}</p>
                        <p className="font-body text-[10px] text-muted-foreground">{(p.notas_sensoriais || []).slice(0, 3).join(", ")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-sm font-medium ${p.estoque <= p.estoque_minimo ? "text-destructive" : ""}`}>
                      {p.estoque}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.ativo ? "default" : "secondary"} className="font-body text-[10px]">
                      {p.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum produto encontrado</p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="font-body text-xs">Nome</Label><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
              <div><Label className="font-body text-xs">Slug</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado" /></div>
            </div>
            <div><Label className="font-body text-xs">Descrição</Label><Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="font-body text-xs">Preço (R$)</Label><Input type="number" step="0.01" value={form.preco} onChange={(e) => set("preco", +e.target.value)} /></div>
              <div><Label className="font-body text-xs">Preço promocional</Label><Input type="number" step="0.01" value={form.preco_promocional ?? ""} onChange={(e) => set("preco_promocional", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Peso padrão (g)</Label><Input type="number" value={form.peso_padrao} onChange={(e) => set("peso_padrao", +e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="font-body text-xs">Estoque</Label><Input type="number" value={form.estoque} onChange={(e) => set("estoque", +e.target.value)} /></div>
              <div><Label className="font-body text-xs">Estoque mínimo</Label><Input type="number" value={form.estoque_minimo} onChange={(e) => set("estoque_minimo", +e.target.value)} /></div>
              <div>
                <Label className="font-body text-xs">Tipo de torra</Label>
                <Select value={form.tipo_torra} onValueChange={(v) => set("tipo_torra", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TORRA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="font-body text-xs">Origem</Label><Input value={form.origem} onChange={(e) => set("origem", e.target.value)} /></div>
              <div><Label className="font-body text-xs">Variedade</Label><Input value={form.variedade} onChange={(e) => set("variedade", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="font-body text-xs">Processo</Label><Input value={form.processo} onChange={(e) => set("processo", e.target.value)} /></div>
              <div><Label className="font-body text-xs">Altitude</Label><Input value={form.altitude} onChange={(e) => set("altitude", e.target.value)} /></div>
              <div><Label className="font-body text-xs">Safra</Label><Input value={form.safra} onChange={(e) => set("safra", e.target.value)} /></div>
            </div>
            <div><Label className="font-body text-xs">SCA Score</Label><Input type="number" value={form.sca_score ?? ""} onChange={(e) => set("sca_score", e.target.value ? +e.target.value : null)} /></div>
            <div><Label className="font-body text-xs">Notas sensoriais (separar por vírgula)</Label><Input value={notasInput} onChange={(e) => setNotasInput(e.target.value)} placeholder="Chocolate, Caramelo, Frutas vermelhas" /></div>
            <div><Label className="font-body text-xs">Descrição sensorial</Label><Textarea value={form.descricao_sensorial} onChange={(e) => set("descricao_sensorial", e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-4 gap-4">
              <div><Label className="font-body text-xs">Acidez (1-10)</Label><Input type="number" min={1} max={10} value={form.acidez ?? ""} onChange={(e) => set("acidez", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Corpo (1-10)</Label><Input type="number" min={1} max={10} value={form.corpo ?? ""} onChange={(e) => set("corpo", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Doçura (1-10)</Label><Input type="number" min={1} max={10} value={form.docura ?? ""} onChange={(e) => set("docura", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Retrogosto (1-10)</Label><Input type="number" min={1} max={10} value={form.retrogosto ?? ""} onChange={(e) => set("retrogosto", e.target.value ? +e.target.value : null)} /></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} />
                <Label className="font-body text-xs">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.destaque} onCheckedChange={(v) => set("destaque", v)} />
                <Label className="font-body text-xs">Destaque</Label>
              </div>
            </div>
            <Button onClick={handleSave} className="font-body text-sm">
              {editing ? "Salvar alterações" : "Criar produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProdutos;
