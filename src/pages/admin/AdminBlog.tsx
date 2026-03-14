import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Bold, Italic, List, Heading, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";

const emptyPost = { titulo: "", slug: "", resumo: "", conteudo: "", imagem_url: "", tags: "" as string, publicado: false };

const AdminBlog = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyPost);
  const [uploading, setUploading] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => { const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false }); return data || []; },
  });

  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(posts, 20);

  const openCreate = () => { setEditing(null); setForm(emptyPost); setOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ titulo: p.titulo, slug: p.slug, resumo: p.resumo || "", conteudo: p.conteudo || "", imagem_url: p.imagem_url || "", tags: (p.tags || []).join(", "), publicado: p.publicado });
    setOpen(true);
  };

  const handleSave = async () => {
    const slug = form.slug || form.titulo.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const tags = (form.tags as string).split(",").map((s) => s.trim()).filter(Boolean);
    const payload = { titulo: form.titulo, slug, resumo: form.resumo, conteudo: form.conteudo, imagem_url: form.imagem_url || null, tags, publicado: form.publicado };
    if (editing) { await supabase.from("blog_posts").update(payload).eq("id", editing.id); toast.success("Post atualizado"); }
    else { await supabase.from("blog_posts").insert(payload); toast.success("Post criado"); }
    qc.invalidateQueries({ queryKey: ["admin-blog"] }); setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-blog"] }); toast.success("Post excluído");
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `blog/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("public-assets").upload(path, file);
    if (error) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("public-assets").getPublicUrl(path);
    setForm((f) => ({ ...f, imagem_url: publicUrl }));
    toast.success("Imagem enviada!");
    setUploading(false);
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("blog-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.conteudo.slice(start, end);
    const newText = form.conteudo.slice(0, start) + prefix + selected + suffix + form.conteudo.slice(end);
    set("conteudo", newText);
  };

  // Simple markdown to HTML for preview
  const markdownPreview = (text: string) => {
    return text
      .replace(/^### (.*$)/gm, '<h3 class="font-display text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="font-display text-xl font-semibold mt-6 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="font-display text-2xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br/>');
  };

  const charCount = form.conteudo.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Blog</h1>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}><Plus className="w-4 h-4" /> Novo Post</Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            {["", "Título", "Tags", "Data", "Status", "Ações"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((p: any) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 w-12">
                  {p.imagem_url && (
                    <div className="w-10 h-10 rounded bg-secondary overflow-hidden">
                      <img src={p.imagem_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-body text-sm font-medium max-w-xs truncate">{p.titulo}</td>
                <td className="px-4 py-3 font-body text-xs text-muted-foreground">{(p.tags || []).join(", ") || "—"}</td>
                <td className="px-4 py-3 font-body text-xs">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3"><Badge variant={p.publicado ? "default" : "secondary"} className="font-body text-[10px]">{p.publicado ? "Publicado" : "Rascunho"}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum post</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Post" : "Novo Post"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label className="font-body text-xs">Título</Label><Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} /></div>
            <div><Label className="font-body text-xs">Slug</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado" /></div>
            <div><Label className="font-body text-xs">Resumo</Label><Textarea value={form.resumo} onChange={(e) => set("resumo", e.target.value)} rows={2} /></div>
            
            {/* Content with preview */}
            <div>
              <Tabs defaultValue="editor">
                <div className="flex items-center justify-between mb-1">
                  <TabsList className="h-8">
                    <TabsTrigger value="editor" className="text-xs font-body">Editor</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs font-body"><Eye className="w-3 h-3 mr-1" /> Preview</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown("**", "**")} title="Negrito"><Bold className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown("*", "*")} title="Itálico"><Italic className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown("## ")} title="Subtítulo"><Heading className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown("- ")} title="Lista"><List className="w-3 h-3" /></Button>
                  </div>
                </div>
                <TabsContent value="editor" className="mt-0">
                  <Textarea id="blog-content" value={form.conteudo} onChange={(e) => set("conteudo", e.target.value)} rows={14} className="font-mono text-sm" />
                  <p className="text-[10px] text-muted-foreground text-right mt-1 font-body">{charCount} caracteres</p>
                </TabsContent>
                <TabsContent value="preview" className="mt-0">
                  <div className="min-h-[300px] border border-border rounded-md p-4 font-body text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: markdownPreview(form.conteudo) }} />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Label className="font-body text-xs">Imagem de capa</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.imagem_url} onChange={(e) => set("imagem_url", e.target.value)} placeholder="URL ou faça upload" className="flex-1" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={uploading} />
                  <Button variant="outline" size="sm" className="font-body text-xs gap-1" asChild disabled={uploading}>
                    <span><Upload className="w-3 h-3" /> {uploading ? "..." : "Upload"}</span>
                  </Button>
                </label>
              </div>
              {form.imagem_url && (
                <div className="mt-2 w-full h-32 rounded-lg overflow-hidden bg-secondary">
                  <img src={form.imagem_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div><Label className="font-body text-xs">Tags (separar por vírgula)</Label><Input value={form.tags} onChange={(e) => set("tags", e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.publicado} onCheckedChange={(v) => set("publicado", v)} /><Label className="font-body text-xs">Publicado</Label></div>
            <Button onClick={handleSave} className="font-body text-sm">{editing ? "Salvar" : "Criar post"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
