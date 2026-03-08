import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";

const emptyCollection = {
  nome: "", slug: "", descricao: "", imagem_url: "", ativo: true, ordem: 0,
};

const AdminCollections = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyCollection);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: collections = [] } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("collections")
        .select("*, collection_produtos(produto_id)")
        .order("ordem", { ascending: true });
      return data || [];
    },
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["admin-all-products"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const filtered = collections.filter((c: any) => c.nome.toLowerCase().includes(search.toLowerCase()));
  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(filtered, 20);

  const openCreate = () => {
    setEditing(null); setForm(emptyCollection); setSelectedProducts([]); setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ nome: c.nome, slug: c.slug, descricao: c.descricao || "", imagem_url: c.imagem_url || "", ativo: c.ativo, ordem: c.ordem });
    setSelectedProducts((c.collection_produtos || []).map((cp: any) => cp.produto_id));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const slug = form.slug || form.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...form, slug };

    let collectionId = editing?.id;

    if (editing) {
      const { error } = await supabase.from("collections").update(payload).eq("id", editing.id);
      if (error) return toast.error("Erro ao atualizar");
    } else {
      const { data, error } = await supabase.from("collections").insert(payload).select("id").single();
      if (error) return toast.error("Erro ao criar: " + error.message);
      collectionId = data.id;
    }

    // Sync products
    if (collectionId) {
      await supabase.from("collection_produtos").delete().eq("collection_id", collectionId);
      if (selectedProducts.length > 0) {
        const rows = selectedProducts.map((pid, idx) => ({
          collection_id: collectionId,
          produto_id: pid,
          ordem: idx,
        }));
        await supabase.from("collection_produtos").insert(rows);
      }
    }

    toast.success(editing ? "Coleção atualizada" : "Coleção criada");
    queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta coleção?")) return;
    await supabase.from("collections").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
    toast.success("Coleção excluída");
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleProduct = (pid: string) => {
    setSelectedProducts((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Coleções</h1>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Nova Coleção
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar coleção…" className="pl-9 font-body text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Coleção", "Produtos", "Status", "Ordem", "Ações"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((c: any) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-body text-sm font-medium">{c.nome}</p>
                  <p className="font-body text-[10px] text-muted-foreground">/{c.slug}</p>
                </td>
                <td className="px-4 py-3 font-body text-sm">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3 text-gold" /> {c.collection_produtos?.length || 0}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.ativo ? "default" : "secondary"} className="font-body text-[10px]">{c.ativo ? "Ativa" : "Inativa"}</Badge>
                </td>
                <td className="px-4 py-3 font-body text-sm">{c.ordem}</td>
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
        {filtered.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhuma coleção encontrada</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Coleção" : "Nova Coleção"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="font-body text-xs">Nome</Label><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
              <div><Label className="font-body text-xs">Slug</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado" /></div>
            </div>
            <div><Label className="font-body text-xs">Descrição</Label><Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={2} /></div>
            <div><Label className="font-body text-xs">URL da Imagem</Label><Input value={form.imagem_url} onChange={(e) => set("imagem_url", e.target.value)} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="font-body text-xs">Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => set("ordem", +e.target.value)} /></div>
              <div className="flex items-center gap-2 pt-5"><Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} /><Label className="font-body text-xs">Ativa</Label></div>
            </div>

            {/* Product assignment */}
            <div className="border-t border-border pt-4">
              <Label className="font-body text-xs font-semibold mb-2 block">Produtos da coleção ({selectedProducts.length})</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded p-2">
                {allProducts.map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 py-1 px-1 hover:bg-muted/30 rounded cursor-pointer">
                    <Checkbox
                      checked={selectedProducts.includes(p.id)}
                      onCheckedChange={() => toggleProduct(p.id)}
                    />
                    <span className="font-body text-xs">{p.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="font-body text-sm">{editing ? "Salvar alterações" : "Criar coleção"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCollections;
