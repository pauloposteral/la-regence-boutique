import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";

const empty = { nome: "", slug: "", descricao: "", imagem_url: "", ordem: 0, ativo: true };

const AdminCategorias = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(empty);

  const { data: cats = [] } = useQuery({
    queryKey: ["admin-categorias"],
    queryFn: async () => { const { data } = await supabase.from("categorias").select("*").order("ordem"); return data || []; },
  });

  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(cats, 20);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ nome: c.nome, slug: c.slug, descricao: c.descricao || "", imagem_url: c.imagem_url || "", ordem: c.ordem, ativo: c.ativo }); setOpen(true); };

  const handleSave = async () => {
    const slug = form.slug || form.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...form, slug };
    if (editing) { await supabase.from("categorias").update(payload).eq("id", editing.id); toast.success("Categoria atualizada"); }
    else { await supabase.from("categorias").insert(payload); toast.success("Categoria criada"); }
    qc.invalidateQueries({ queryKey: ["admin-categorias"] }); setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    await supabase.from("categorias").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-categorias"] }); toast.success("Categoria excluída");
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Categorias</h1>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}><Plus className="w-4 h-4" /> Nova Categoria</Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            {["Nome", "Slug", "Ordem", "Status", "Ações"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((c: any) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-sm font-medium">{c.nome}</td>
                <td className="px-4 py-3 font-body text-xs text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 font-body text-sm">{c.ordem}</td>
                <td className="px-4 py-3"><Badge variant={c.ativo ? "default" : "secondary"} className="font-body text-[10px]">{c.ativo ? "Ativa" : "Inativa"}</Badge></td>
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
        {cats.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhuma categoria</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label className="font-body text-xs">Nome</Label><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
            <div><Label className="font-body text-xs">Slug</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado" /></div>
            <div><Label className="font-body text-xs">Descrição</Label><Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={2} /></div>
            <div><Label className="font-body text-xs">URL da imagem</Label><Input value={form.imagem_url} onChange={(e) => set("imagem_url", e.target.value)} /></div>
            <div><Label className="font-body text-xs">Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => set("ordem", +e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} /><Label className="font-body text-xs">Ativa</Label></div>
            <Button onClick={handleSave} className="font-body text-sm">{editing ? "Salvar" : "Criar categoria"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategorias;
