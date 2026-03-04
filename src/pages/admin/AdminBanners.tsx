import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const emptyBanner = { titulo: "", subtitulo: "", imagem_url: "", link: "", ordem: 0, ativo: true };

const AdminBanners = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyBanner);

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => { const { data } = await supabase.from("banners").select("*").order("ordem"); return data || []; },
  });

  const openCreate = () => { setEditing(null); setForm(emptyBanner); setOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setForm({ titulo: b.titulo, subtitulo: b.subtitulo || "", imagem_url: b.imagem_url || "", link: b.link || "", ordem: b.ordem, ativo: b.ativo }); setOpen(true); };

  const handleSave = async () => {
    if (editing) { await supabase.from("banners").update(form).eq("id", editing.id); toast.success("Banner atualizado"); }
    else { await supabase.from("banners").insert(form); toast.success("Banner criado"); }
    qc.invalidateQueries({ queryKey: ["admin-banners"] }); setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-banners"] }); toast.success("Banner excluído");
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Banners</h1>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}><Plus className="w-4 h-4" /> Novo Banner</Button>
      </div>

      <div className="grid gap-4">
        {banners.map((b: any) => (
          <div key={b.id} className="border border-border rounded-lg p-4 bg-card flex items-center gap-4">
            <div className="w-24 h-14 rounded bg-secondary overflow-hidden shrink-0">
              {b.imagem_url ? <img src={b.imagem_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem img</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium truncate">{b.titulo}</p>
              {b.subtitulo && <p className="font-body text-xs text-muted-foreground truncate">{b.subtitulo}</p>}
            </div>
            <Badge variant={b.ativo ? "default" : "secondary"} className="font-body text-[10px] shrink-0">{b.ativo ? "Ativo" : "Inativo"}</Badge>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum banner</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Banner" : "Novo Banner"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label className="font-body text-xs">Título</Label><Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} /></div>
            <div><Label className="font-body text-xs">Subtítulo</Label><Input value={form.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} /></div>
            <div><Label className="font-body text-xs">URL da imagem</Label><Input value={form.imagem_url} onChange={(e) => set("imagem_url", e.target.value)} /></div>
            <div><Label className="font-body text-xs">Link</Label><Input value={form.link} onChange={(e) => set("link", e.target.value)} /></div>
            <div><Label className="font-body text-xs">Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => set("ordem", +e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} /><Label className="font-body text-xs">Ativo</Label></div>
            <Button onClick={handleSave} className="font-body text-sm">{editing ? "Salvar" : "Criar banner"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
