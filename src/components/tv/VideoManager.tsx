import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Check, Film, MonitorPlay, Pause, Play, RefreshCw, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTVVideos } from "@/hooks/useTVVideos";
import { inspectVideo, uploadTVVideo } from "@/lib/tvUpload";
import { parseYouTubeUrl } from "@/lib/youtube";
import { TV_BUCKET, validateVideoFile, type TVVideo } from "@/lib/tvPlaylist";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const actionClass = "inline-flex items-center justify-center gap-2 rounded-full border border-gold/35 px-5 py-3 text-sm text-brown-dark transition-colors hover:bg-gold/10 disabled:opacity-50";
const PAGE_SIZE = 12;
const searchableTitle = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
type PlaylistFilter = "all" | "active" | "paused" | "archived";

const inputClass = "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

function safeSourceUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function VideoRow({ video, refresh }: { video: TVVideo; refresh: () => Promise<void> }) {
  const [title, setTitle] = useState(video.title);
  const [order, setOrder] = useState(video.sort_order);
  const [fit, setFit] = useState(video.fit);
  const [duration, setDuration] = useState(video.max_duration_seconds?.toString() ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const archived = !!video.archived_at;
  const sourceUrl = safeSourceUrl(video.source_url);
  const [formError, setFormError] = useState("");
  useEffect(() => { setTitle(video.title); setOrder(video.sort_order); setFit(video.fit); setDuration(video.max_duration_seconds?.toString() ?? ""); }, [video]);
  const update = async (values: Partial<TVVideo>) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("tv_videos").update(values).eq("id", video.id).select("id").single();
      if (error) throw error;
      await refresh();
      toast.success("Programação atualizada. A TV receberá a alteração em até 15 segundos.");
    } catch { toast.error("Não foi possível salvar. Confira sua conexão e tente novamente."); }
    finally { setBusy(false); }
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !Number.isInteger(order) || order < 0 || order > 999999) {
      setFormError("Informe um nome e uma ordem inteira entre 0 e 999999.");
      (event.currentTarget.elements.namedItem(!title.trim() ? "title" : "order") as HTMLInputElement)?.focus();
      return;
    }
    const maxDuration = duration.trim() ? Number(duration) : null;
    if (maxDuration !== null && (!Number.isInteger(maxDuration) || maxDuration < 1 || maxDuration > 3600)) {
      setFormError("Informe um tempo inteiro entre 1 e 3600 segundos ou deixe em branco para o vídeo inteiro.");
      (event.currentTarget.elements.namedItem("duration") as HTMLInputElement)?.focus();
      return;
    }
    setFormError("");
    void update({ title: title.trim(), sort_order: order, fit, max_duration_seconds: maxDuration });
  };
  return <article aria-label={video.title} className={`overflow-hidden rounded-xl border bg-white ${video.active && !archived ? "border-gold/30" : "border-border"}`}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
      <h3 className="min-w-0 break-words text-sm font-medium">{video.title}</h3>
      <span className="rounded-full bg-cream px-3 py-1 text-xs text-muted-foreground">{video.source_type === "youtube" ? "YouTube · " : "Arquivo · "}{archived ? "Arquivado" : video.active ? "Na programação" : "Pausado"}</span>
    </div>
    {(sourceUrl || video.credit) && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-3 text-xs text-muted-foreground">
      {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brown-dark underline decoration-gold/60 underline-offset-4 hover:text-gold-dark">Ver origem do vídeo</a>}
      {video.credit && <p className="break-words">Crédito: {video.credit}</p>}
    </div>}
    <form noValidate onSubmit={save} className="space-y-3 p-4">
      <label className="block space-y-2 text-xs text-muted-foreground"><span>Nome do vídeo</span><input name="title" className={inputClass} value={title} maxLength={120} required aria-invalid={!!formError && !title.trim()} aria-describedby={formError ? `video-error-${video.id}` : undefined} onChange={e => setTitle(e.target.value)} /></label>
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <label className="space-y-2 text-xs text-muted-foreground"><span>Ordem</span><input name="order" className={inputClass} type="number" min={0} max={999999} required value={order} onChange={e => setOrder(Number(e.target.value))} /></label>
        <label className="space-y-2 text-xs text-muted-foreground"><span>Enquadramento</span><select disabled={video.source_type === "youtube"} className={inputClass} value={fit} onChange={e => setFit(e.target.value as TVVideo["fit"])}><option value="contain">Vídeo inteiro</option><option value="cover">Preencher tela (recorta)</option></select></label>
      </div>
      <div className="space-y-2 text-xs text-muted-foreground"><label htmlFor={`video-duration-input-${video.id}`} className="block">Tempo na TV (segundos, opcional)</label><input id={`video-duration-input-${video.id}`} name="duration" className={inputClass} type="number" min={1} max={3600} step={1} value={duration} placeholder="Vídeo inteiro" aria-describedby={`video-duration-${video.id}`} onChange={event => setDuration(event.target.value)} /><span id={`video-duration-${video.id}`} className="block leading-relaxed">Em branco, toca o vídeo inteiro. Para passar ao próximo após 15 segundos, informe 15.</span></div>
      {formError && <p id={`video-error-${video.id}`} role="alert" className="text-sm text-destructive">{formError}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={actionClass}><Check size={16} />Salvar</button>
        {archived ? <button type="button" disabled={busy} className={actionClass} onClick={() => void update({ active: false, archived_at: null })}><ArchiveRestore size={16} />Restaurar como pausado</button> : <>
          <button type="button" disabled={busy} className={actionClass} onClick={() => void update({ active: !video.active })}>{video.active ? <Pause size={16} /> : <Play size={16} />}{video.active ? "Pausar na TV" : "Ativar na TV"}</button>
          {video.active && <a href={`/video?iniciar=${encodeURIComponent(video.id)}`} target="_blank" rel="noopener noreferrer" className={actionClass}><MonitorPlay size={16} />Ver na TV</a>}
          <AlertDialog><AlertDialogTrigger asChild><button type="button" disabled={busy} className={actionClass} aria-label={`Arquivar ${video.title}`}><Archive size={16} />Arquivar</button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Arquivar este vídeo?</AlertDialogTitle><AlertDialogDescription>“{video.title}” sairá da programação. O arquivo será preservado e poderá ser restaurado como pausado na lista de arquivados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel><AlertDialogAction className="rounded-full" onClick={() => void update({ active: false, archived_at: new Date().toISOString() })}>Arquivar vídeo</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </>}
        <button type="button" className={actionClass} aria-expanded={showPreview} aria-controls={`video-preview-${video.id}`} onClick={() => setShowPreview(value => !value)}>{showPreview ? "Fechar prévia" : "Mostrar prévia"}</button>
      </div>
    </form>
    {showPreview && <div id={`video-preview-${video.id}`} className="aspect-video bg-brown-deep">
      {video.source_type === "youtube" ? <iframe title={`Prévia: ${video.title}`} src={`https://www.youtube.com/embed/${video.youtube_id}`} className="h-full w-full" loading="lazy" allow="encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : <video src={video.url} controls playsInline preload="none" className="h-full w-full object-contain" aria-label={`Prévia: ${video.title}`} />}
    </div>}
  </article>;
}

export default function VideoManager() {
  const { data: videos = [], isLoading, isError, refetch } = useTVVideos(true);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PlaylistFilter>("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const currentVideos = videos.filter(video => !video.archived_at);
  const filteredVideos = videos.filter(video => {
    const matchesStatus = filter === "archived" ? !!video.archived_at : !video.archived_at && (filter === "all" || (filter === "active" ? video.active : !video.active));
    return matchesStatus && searchableTitle(video.title).includes(searchableTitle(search.trim()));
  });
  const pageCount = Math.max(1, Math.ceil(filteredVideos.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageVideos = filteredVideos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const refreshList = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(true);
  const [validation, setValidation] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController>();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["tv-videos"] }); };
  const selectFile = (selected?: File) => {
    if (!selected || busy) return;
    const error = validateVideoFile(selected);
    setValidation(error ?? "");
    if (error) { setFile(null); return; }
    setFile(selected);
    setTitle(selected.name.replace(/\.(mp4|webm)$/i, "").slice(0, 120));
  };
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (!file || !title.trim()) {
      setValidation(!file ? "Escolha um vídeo para enviar." : "Dê um nome ao vídeo antes de enviar.");
      (event.currentTarget.elements.namedItem("upload-title") as HTMLInputElement)?.focus();
      return;
    }
    setBusy(true); setValidation(""); setProgress(0); setPhase("Verificando vídeo…");
    controller.current = new AbortController();
    let uploadedPath: string | undefined;
    let registered = false;
    try {
      await inspectVideo(file);
      setPhase("Enviando vídeo…");
      const result = await uploadTVVideo(file, controller.current.signal, value => { if (mounted.current) setProgress(value); });
      uploadedPath = result.path;
      if (controller.current.signal.aborted) throw new DOMException("Envio cancelado", "AbortError");
      setPhase("Adicionando à programação…");
      const nextOrder = Math.max(0, ...videos.map(v => v.sort_order)) + 1;
      const { error } = await supabase.from("tv_videos").insert({ title: title.trim(), url: result.url, storage_path: result.path, active, sort_order: nextOrder, fit: "contain" });
      if (error) throw error;
      registered = true;
      await refresh();
      if (mounted.current) {
        toast.success(active ? "Vídeo enviado. Aparecerá na TV em até 15 segundos." : "Vídeo enviado e salvo como pausado.");
        setFile(null); setTitle(""); if (input.current) input.current.value = "";
      }
    } catch (error) {
      if (uploadedPath && !registered) await supabase.storage.from(TV_BUCKET).remove([uploadedPath]);
      if (mounted.current) setValidation(error instanceof Error ? error.message : "Não foi possível enviar o vídeo. Tente novamente.");
    } finally { if (mounted.current) { setBusy(false); setPhase(""); } }
  };

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:py-12">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
      <div><p className="mb-3 text-[11px] uppercase tracking-[.3em] text-gold">La Régence · TV</p><h1 className="font-display text-3xl sm:text-5xl">Sua vitrine em movimento.</h1><p className="mt-3 max-w-xl text-sm text-muted-foreground">Envie os vídeos e escolha o que passa na televisão. A programação se repete automaticamente.</p></div>
      <div className="flex gap-3"><Link to="/admin" className={actionClass}>Painel</Link><a href="/video" target="_blank" rel="noopener noreferrer" className={`${actionClass} bg-gold text-white hover:bg-gold-dark`}><MonitorPlay size={18} />Abrir player</a></div>
    </header>
    <div className="grid items-start gap-8 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-6">
        <form noValidate onSubmit={upload} className="rounded-xl border border-gold/25 bg-white p-5 sm:p-6">
          <h2 className="mb-5 text-xl">Enviar um vídeo</h2>
          <div className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dropActive ? "border-gold bg-gold/10" : "border-gold/30 bg-cream"}`}
            onDragOver={event => { event.preventDefault(); setDropActive(true); }} onDragLeave={() => setDropActive(false)} onDrop={event => { event.preventDefault(); setDropActive(false); selectFile(event.dataTransfer.files[0]); }}>
            <UploadCloud className="mx-auto mb-4 h-9 w-9 text-gold" />
            <p className="mb-4 break-words text-sm">{file ? file.name : "Arraste seu vídeo até aqui"}</p>
            <input ref={input} type="file" accept="video/mp4,video/webm,.mp4,.webm" className="sr-only" id="tv-video-file" disabled={busy} onChange={event => selectFile(event.target.files?.[0])} />
            <button type="button" onClick={() => input.current?.click()} className={actionClass} disabled={busy}>{file ? "Trocar vídeo" : "Escolher vídeo"}</button>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">MP4 ou WebM · até 50 MB por vídeo<br />Para TVs, prefira MP4/H.264 em horizontal (16:9).</p>
          </div>
          {file && <div className="mt-5 space-y-4">
            <label className="block space-y-2 text-xs text-muted-foreground"><span>Nome do vídeo</span><input name="upload-title" className={inputClass} maxLength={120} required value={title} disabled={busy} aria-invalid={!!validation && !title.trim()} aria-describedby={validation ? "upload-error" : undefined} onChange={event => setTitle(event.target.value)} /></label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={active} disabled={busy} onChange={event => setActive(event.target.checked)} className="h-4 w-4 accent-gold" />Exibir na TV após o envio</label>
            {busy && <div role="status"><div className="mb-2 flex justify-between text-xs"><span>{phase}</span><span>{progress}%</span></div><progress value={progress} max={100} aria-label="Progresso do envio" className="h-2 w-full accent-gold" /></div>}
            <button type="submit" disabled={busy || isLoading || isError} className={`${actionClass} w-full bg-gold text-white hover:bg-gold-dark`}><UploadCloud size={17} />{busy ? "Enviando…" : "Enviar vídeo"}</button>
            {busy && <button type="button" className={`${actionClass} w-full`} onClick={() => controller.current?.abort()}>Cancelar envio</button>}
          </div>}
          {validation && <p id="upload-error" role="alert" className="mt-4 text-sm text-destructive">{validation}</p>}
        </form>
        <YouTubeForm videos={videos} refresh={refresh} disabled={isLoading || isError} />
        <div className="rounded-xl bg-brown-deep p-6 text-white"><MonitorPlay className="mb-3 text-gold-light" /><h2 className="text-lg">Na televisão</h2><p className="mt-3 break-all text-sm text-gold-light">cafelaregence.com.br/video</p><p className="mt-3 text-xs leading-relaxed text-white/75">Abra o endereço no navegador da TV e selecione Tela cheia. Os controles somem sozinhos. O som começa desligado e pode ser ativado no player.</p></div>
      </aside>
      <section aria-label="Programação de vídeos">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Programação</h2><span className="rounded-full border border-gold/25 px-3 py-1 text-xs text-muted-foreground">{currentVideos.filter(v => v.active).length} ativos · {currentVideos.length} vídeos · {videos.length - currentVideos.length} arquivados</span></div>
        <p className="mb-5 text-xs text-muted-foreground">Os menores números passam primeiro. Alterações chegam à TV em até 15 segundos. Ative um vídeo pausado para incluí-lo na sequência.</p>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <label className="min-w-40 flex-1 space-y-2 text-xs text-muted-foreground"><span>Buscar por nome</span><input type="search" className={inputClass} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Nome do vídeo" /></label>
          <label className="space-y-2 text-xs text-muted-foreground"><span>Filtrar vídeos</span><select className={inputClass} value={filter} onChange={event => { setFilter(event.target.value as PlaylistFilter); setPage(1); }}><option value="all">Todos</option><option value="active">Ativos</option><option value="paused">Pausados</option><option value="archived">Arquivados</option></select></label>
          <button type="button" className={actionClass} disabled={refreshing || isLoading} onClick={() => void refreshList()}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar lista"}</button>
          {search && <button type="button" className={actionClass} onClick={() => { setSearch(""); setPage(1); }}>Limpar busca</button>}
        </div>
        {isLoading ? <p role="status">Carregando vídeos…</p> : isError ? <div role="alert"><p>Não foi possível carregar os vídeos.</p><button className={`${actionClass} mt-3`} onClick={() => void refreshList()}>Tentar novamente</button></div> : filteredVideos.length ? <>
          <p role="status" className="mb-3 text-xs text-muted-foreground">{filteredVideos.length} {filteredVideos.length === 1 ? "vídeo encontrado" : "vídeos encontrados"} · Página {currentPage} de {pageCount}</p>
          <div className="grid gap-4 xl:grid-cols-2">{pageVideos.map(video => <VideoRow key={video.id} video={video} refresh={refresh} />)}</div>
          {pageCount > 1 && <nav aria-label="Páginas da programação" className="mt-5 flex items-center justify-between gap-3"><button type="button" className={actionClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span className="text-xs text-muted-foreground">Página {currentPage} de {pageCount}</span><button type="button" className={actionClass} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Próxima</button></nav>}
        </> : <div className="rounded-xl border border-dashed border-gold/30 p-8 text-center"><Film className="mx-auto mb-4 h-9 w-9 text-gold" /><p>{videos.length ? "Nenhum vídeo encontrado para esta busca ou filtro." : "Nenhum vídeo na programação. Envie o primeiro ao lado."}</p>{(search || filter !== "all") && <button type="button" className={`${actionClass} mt-4`} onClick={() => { setSearch(""); setFilter("all"); setPage(1); }}>Mostrar todos</button>}</div>}

      </section>
    </div>
  </div>;
}

function YouTubeForm({ videos, refresh, disabled }: { videos: TVVideo[]; refresh(): Promise<void>; disabled: boolean }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || disabled) return;
    const parsed = parseYouTubeUrl(url);
    if (!parsed || !title.trim()) { setError(!parsed ? "Cole um link válido de vídeo do YouTube." : "Dê um nome ao vídeo."); return; }
    setBusy(true); setError("");
    try {
      const { error: insertError } = await supabase.from("tv_videos").insert({
        title: title.trim(), url: parsed.url, source_type: "youtube", youtube_id: parsed.id,
        storage_path: null, fit: "contain", active, sort_order: Math.min(999999, Math.max(0, ...videos.map(v => v.sort_order)) + 1),
      });
      if (insertError) throw insertError;
      await refresh(); setUrl(""); setTitle("");
      toast.success(active ? "YouTube adicionado. Aparecerá na TV em até 15 segundos." : "YouTube salvo como pausado.");
    } catch { setError("Não foi possível adicionar. Confira sua conexão e tente novamente."); }
    finally { setBusy(false); }
  };
  return <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border border-gold/25 bg-white p-5 sm:p-6" aria-label="Adicionar YouTube">
    <h2 className="text-xl">Adicionar do YouTube</h2>
    <p className="text-xs leading-relaxed text-muted-foreground">Cole o link e inclua o vídeo na mesma programação dos arquivos enviados.</p>
    <label className="block space-y-2 text-xs"><span>Link do YouTube</span><input className={inputClass} type="url" value={url} maxLength={2048} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" disabled={busy} /></label>
    <label className="block space-y-2 text-xs"><span>Nome para a programação</span><input className={inputClass} value={title} maxLength={120} onChange={e => setTitle(e.target.value)} disabled={busy} /></label>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} disabled={busy} className="h-4 w-4 accent-gold" />Exibir na TV ao adicionar</label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button type="submit" className={`${actionClass} w-full`} disabled={busy || disabled}>{busy ? "Adicionando…" : "Adicionar à programação"}</button>
    <p className="text-xs leading-relaxed text-muted-foreground">O YouTube mantém seus controles e pode exibir anúncios. Vídeos com incorporação bloqueada serão pulados. Para uma exibição contínua, prefira seus arquivos MP4.</p>
  </form>;
}
