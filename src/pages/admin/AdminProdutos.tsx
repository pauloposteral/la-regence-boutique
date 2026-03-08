import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search, Upload, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import AdminPagination from "@/components/admin/AdminPagination";
import type { Database } from "@/integrations/supabase/types";

type TipoTorra = Database["public"]["Enums"]["tipo_torra"];
type TipoMoagem = Database["public"]["Enums"]["tipo_moagem"];

const TORRA_LABELS: Record<string, string> = { clara: "Clara", media: "Média", media_escura: "Média Escura", escura: "Escura" };
const MOAGEM_LABELS: Record<string, string> = { graos: "Grãos", grossa: "Grossa", media: "Média", fina: "Fina", extra_fina: "Extra Fina" };

const emptyProduct = {
  nome: "", slug: "", descricao: "", preco: 0, preco_promocional: null as number | null,
  estoque: 0, estoque_minimo: 5, ativo: true, destaque: false,
  origem: "", variedade: "", processo: "", altitude: "", safra: "",
  sca_score: null as number | null, tipo_torra: "media" as TipoTorra,
  notas_sensoriais: [] as string[], descricao_sensorial: "",
  acidez: null as number | null, corpo: null as number | null,
  docura: null as number | null, retrogosto: null as number | null,
  peso_padrao: 250,
  sku: "",
  intensidade: null as number | null,
};

interface Variante {
  id?: string;
  moagem: TipoMoagem;
  peso: number;
  preco: number;
  estoque: number;
  ativo: boolean;
  _delete?: boolean;
}

const AdminProdutos = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyProduct);
  const [notasInput, setNotasInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [prodImages, setProdImages] = useState<any[]>([]);

  const { data: produtos = [] } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("*, produto_imagens(id, url, principal, ordem), variantes(id, moagem, peso, preco, estoque, ativo)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = produtos.filter((p: any) => p.nome.toLowerCase().includes(search.toLowerCase()));
  const { page, totalPages, paginated, next, prev, goTo, total } = usePagination(filtered, 20);

  const openCreate = () => { setEditing(null); setForm(emptyProduct); setNotasInput(""); setVariantes([]); setProdImages([]); setDialogOpen(true); };

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
      sku: (p as any).sku || "",
      intensidade: (p as any).intensidade ?? null,
    });
    setNotasInput((p.notas_sensoriais || []).join(", "));
    setVariantes((p.variantes || []).map((v: any) => ({ ...v })));
    setProdImages((p.produto_imagens || []).sort((a: any, b: any) => a.ordem - b.ordem));
    setDialogOpen(true);
  };

  const duplicateProduct = (p: any) => {
    setEditing(null);
    setForm({
      nome: p.nome + " (cópia)", slug: "", descricao: p.descricao || "", preco: p.preco,
      preco_promocional: p.preco_promocional, estoque: 0, estoque_minimo: p.estoque_minimo,
      ativo: false, destaque: false, origem: p.origem || "", variedade: p.variedade || "",
      processo: p.processo || "", altitude: p.altitude || "", safra: p.safra || "",
      sca_score: p.sca_score, tipo_torra: p.tipo_torra || "media",
      notas_sensoriais: p.notas_sensoriais || [], descricao_sensorial: p.descricao_sensorial || "",
      acidez: p.acidez, corpo: p.corpo, docura: p.docura, retrogosto: p.retrogosto,
      peso_padrao: p.peso_padrao || 250,
      sku: "",
      intensidade: (p as any).intensidade ?? null,
    });
    setNotasInput((p.notas_sensoriais || []).join(", "));
    setVariantes((p.variantes || []).map((v: any) => ({ moagem: v.moagem, peso: v.peso, preco: v.preco, estoque: 0, ativo: v.ativo })));
    setProdImages([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const notas = notasInput.split(",").map((s) => s.trim()).filter(Boolean);
    const slug = form.slug || form.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...form, slug, notas_sensoriais: notas };

    let productId = editing?.id;

    if (editing) {
      const { error } = await supabase.from("produtos").update(payload).eq("id", editing.id);
      if (error) return toast.error("Erro ao atualizar");
    } else {
      const { data, error } = await supabase.from("produtos").insert(payload).select("id").single();
      if (error) return toast.error("Erro ao criar: " + error.message);
      productId = data.id;
    }

    // Save variantes
    if (productId) {
      for (const v of variantes) {
        if (v._delete && v.id) {
          await supabase.from("variantes").delete().eq("id", v.id);
        } else if (v.id && !v._delete) {
          await supabase.from("variantes").update({ moagem: v.moagem, peso: v.peso, preco: v.preco, estoque: v.estoque, ativo: v.ativo }).eq("id", v.id);
        } else if (!v.id && !v._delete) {
          await supabase.from("variantes").insert({ produto_id: productId, moagem: v.moagem, peso: v.peso, preco: v.preco, estoque: v.estoque, ativo: v.ativo });
        }
      }
    }

    toast.success(editing ? "Produto atualizado" : "Produto criado");
    queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("produtos").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
    toast.success("Produto excluído");
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${productId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
    if (uploadError) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    const existingImages = await supabase.from("produto_imagens").select("id").eq("produto_id", productId);
    const isFirst = !existingImages.data || existingImages.data.length === 0;
    await supabase.from("produto_imagens").insert({ produto_id: productId, url: publicUrl, principal: isFirst, ordem: (existingImages.data?.length || 0) });
    queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
    toast.success("Imagem enviada!");
    setUploading(false);
  };

  const deleteImage = async (imgId: string) => {
    await supabase.from("produto_imagens").delete().eq("id", imgId);
    setProdImages((prev) => prev.filter((i) => i.id !== imgId));
    queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
    toast.success("Imagem removida");
  };

  const addVariante = () => {
    setVariantes((prev) => [...prev, { moagem: "graos" as TipoMoagem, peso: 250, preco: 0, estoque: 0, ativo: true }]);
  };

  const updateVariante = (idx: number, key: string, value: any) => {
    setVariantes((prev) => prev.map((v, i) => i === idx ? { ...v, [key]: value } : v));
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Produtos</h1>
        <Button size="sm" className="gap-1.5 font-body text-xs" onClick={openCreate}><Plus className="w-4 h-4" /> Novo Produto</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar produto…" className="pl-9 font-body text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Produto", "Preço", "Estoque", "Status", "Imagem", "Ações"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((p: any) => {
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
                    <span className={`font-body text-sm font-medium ${p.estoque <= p.estoque_minimo ? "text-destructive" : ""}`}>{p.estoque}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.ativo ? "default" : "secondary"} className="font-body text-[10px]">{p.ativo ? "Ativo" : "Inativo"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(p.id, file); }} disabled={uploading} />
                      <div className="flex items-center gap-1 text-xs font-body text-accent hover:underline"><Upload className="w-3 h-3" /> {uploading ? "..." : "Upload"}</div>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateProduct(p)} title="Duplicar"><Copy className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum produto encontrado</p>}
        <div className="px-4 pb-3">
          <AdminPagination page={page} totalPages={totalPages} total={total} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
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
                  <SelectContent>{Object.entries(TORRA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
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
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="font-body text-xs">SKU</Label><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="LR-001" /></div>
              <div><Label className="font-body text-xs">Intensidade (1-10)</Label><Input type="number" min={1} max={10} value={form.intensidade ?? ""} onChange={(e) => set("intensidade", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">SCA Score</Label><Input type="number" value={form.sca_score ?? ""} onChange={(e) => set("sca_score", e.target.value ? +e.target.value : null)} /></div>
            </div>
            <div><Label className="font-body text-xs">Notas sensoriais (separar por vírgula)</Label><Input value={notasInput} onChange={(e) => setNotasInput(e.target.value)} placeholder="Chocolate, Caramelo, Frutas vermelhas" /></div>
            <div><Label className="font-body text-xs">Descrição sensorial</Label><Textarea value={form.descricao_sensorial} onChange={(e) => set("descricao_sensorial", e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-4 gap-4">
              <div><Label className="font-body text-xs">Acidez (1-10)</Label><Input type="number" min={1} max={10} value={form.acidez ?? ""} onChange={(e) => set("acidez", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Corpo (1-10)</Label><Input type="number" min={1} max={10} value={form.corpo ?? ""} onChange={(e) => set("corpo", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Doçura (1-10)</Label><Input type="number" min={1} max={10} value={form.docura ?? ""} onChange={(e) => set("docura", e.target.value ? +e.target.value : null)} /></div>
              <div><Label className="font-body text-xs">Retrogosto (1-10)</Label><Input type="number" min={1} max={10} value={form.retrogosto ?? ""} onChange={(e) => set("retrogosto", e.target.value ? +e.target.value : null)} /></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} /><Label className="font-body text-xs">Ativo</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.destaque} onCheckedChange={(v) => set("destaque", v)} /><Label className="font-body text-xs">Destaque</Label></div>
            </div>

            {/* Images section */}
            {editing && prodImages.length > 0 && (
              <div>
                <Label className="font-body text-xs mb-2 block">Imagens do produto</Label>
                <div className="flex flex-wrap gap-2">
                  {prodImages.map((img) => (
                    <div key={img.id} className="relative w-16 h-16 rounded border border-border overflow-hidden group">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.principal && <span className="absolute top-0 left-0 bg-accent text-[8px] text-accent-foreground px-1">Principal</span>}
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variantes section */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-body text-xs font-semibold">Variantes (Moagem + Peso)</Label>
                <Button variant="outline" size="sm" className="font-body text-xs h-7" onClick={addVariante}><Plus className="w-3 h-3 mr-1" /> Variante</Button>
              </div>
              {variantes.filter((v) => !v._delete).map((v, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
                  <div>
                    <Label className="font-body text-[10px]">Moagem</Label>
                    <Select value={v.moagem} onValueChange={(val) => updateVariante(idx, "moagem", val)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(MOAGEM_LABELS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="font-body text-[10px]">Peso (g)</Label><Input type="number" className="h-8 text-xs" value={v.peso} onChange={(e) => updateVariante(idx, "peso", +e.target.value)} /></div>
                  <div><Label className="font-body text-[10px]">Preço</Label><Input type="number" step="0.01" className="h-8 text-xs" value={v.preco} onChange={(e) => updateVariante(idx, "preco", +e.target.value)} /></div>
                  <div><Label className="font-body text-[10px]">Estoque</Label><Input type="number" className="h-8 text-xs" value={v.estoque} onChange={(e) => updateVariante(idx, "estoque", +e.target.value)} /></div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                    if (v.id) updateVariante(idx, "_delete", true);
                    else setVariantes((prev) => prev.filter((_, i) => i !== idx));
                  }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>

            <Button onClick={handleSave} className="font-body text-sm">{editing ? "Salvar alterações" : "Criar produto"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProdutos;
