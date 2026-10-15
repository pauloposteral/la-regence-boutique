import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Check, Film, MonitorPlay, Pause, Play, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTVVideos } from "@/hooks/useTVVideos";
import { inspectVideo, uploadTVVideo } from "@/lib/tvUpload";
import { TV_BUCKET, validateVideoFile, type TVVideo } from "@/lib/tvPlaylist";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const actionClass = "inline-flex items-center justify-center gap-2 rounded-full border border-gold/35 px-5 py-3 text-sm text-brown-dark transition-colors hover:bg-gold/10 disabled:opacity-50";
const inputClass = "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

function VideoRow({ video, refresh }: { video: TVVideo; refresh: () => Promise<void> }) {
  const [title, setTitle] = useState(video.title);
  const [order, setOrder] = useState(video.sort_order);
  const [fit, setFit] = useState(video.fit);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => { setTitle(video.title); setOrder(video.sort_order); setFit(video.fit); }, [video]);
  const update = async (values: Partial<TVVideo>) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("tv_videos").update(values).eq("id", video.id).select("id").single();
      if (error) throw error;
      await refresh();
      toast.success("Programação atualizada. A TV receberá a alteração em até 1 minuto.");
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
    setFormError("");
    void update({ title: title.trim(), sort_order: order, fit });
  };
  return <article className={`overflow-hidden rounded-xl border bg-white ${video.active ? "border-gold/30" : "border-border"}`}>
    <div className="relative aspect-video bg-brown-deep">
      <video src={video.url} controls playsInline preload="none" className="h-full w-full object-contain" aria-label={`Prévia: ${video.title}`} />
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-brown-deep/90 px-3 py-1 text-xs text-white">{video.active ? "Na programação" : "Pausado"}</span>
    </div>
    <form noValidate onSubmit={save} className="space-y-4 p-5">
      <label className="block space-y-2 text-xs text-muted-foreground"><span>Nome do vídeo</span><input name="title" className={inputClass} value={title} maxLength={120} required aria-invalid={!!formError && !title.trim()} aria-describedby={formError ? `video-error-${video.id}` : undefined} onChange={e => setTitle(e.target.value)} /></label>
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <label className="space-y-2 text-xs text-muted-foreground"><span>Ordem</span><input name="order" className={inputClass} type="number" min={0} max={999999} required value={order} onChange={e => setOrder(Number(e.target.value))} /></label>
        <label className="space-y-2 text-xs text-muted-foreground"><span>Enquadramento</span><select className={inputClass} value={fit} onChange={e => setFit(e.target.value as TVVideo["fit"])}><option value="contain">Vídeo inteiro</option><option value="cover">Preencher tela (recorta)</option></select></label>
      </div>
      {formError && <p id={`video-error-${video.id}`} role="alert" className="text-sm text-destructive">{formError}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={actionClass}><Check size={16} />Salvar</button>
        <button type="button" disabled={busy} className={actionClass} onClick={() => void update({ active: !video.active })}>{video.active ? <Pause size={16} /> : <Play size={16} />}{video.active ? "Pausar na TV" : "Ativar na TV"}</button>
        <AlertDialog><AlertDialogTrigger asChild><button type="button" disabled={busy} className="rounded-full p-3 text-muted-foreground hover:text-destructive" aria-label={`Arquivar ${video.title}`}><Archive size={17} /></button></AlertDialogTrigger>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Arquivar este vídeo?</AlertDialogTitle><AlertDialogDescription>“{video.title}” sairá da programação. O arquivo será preservado no servidor.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel><AlertDialogAction className="rounded-full" onClick={() => void update({ active: false, archived_at: new Date().toISOString() })}>Arquivar vídeo</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  </article>;
}

export default function VideoManager() {
  const { data: videos = [], isLoading, isError, refetch } = useTVVideos(true);
  const queryClient = useQueryClient();
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
        toast.success(active ? "Vídeo enviado. Aparecerá na TV em até 1 minuto." : "Vídeo enviado e salvo como pausado.");
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
        <div className="rounded-xl bg-brown-deep p-6 text-white"><MonitorPlay className="mb-3 text-gold-light" /><h2 className="text-lg">Na televisão</h2><p className="mt-3 break-all text-sm text-gold-light">cafelaregence.com.br/video</p><p className="mt-3 text-xs leading-relaxed text-white/75">Abra o endereço no navegador da TV e selecione Tela cheia. Os controles somem sozinhos. O som começa desligado e pode ser ativado no player.</p></div>
      </aside>
      <section aria-label="Programação de vídeos">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-2xl">Programação</h2><span className="rounded-full border border-gold/25 px-3 py-1 text-xs text-muted-foreground">{videos.filter(v => v.active).length} ativos · {videos.length} vídeos</span></div>
        <p className="mb-5 text-xs text-muted-foreground">Os menores números passam primeiro. Alterações chegam à TV em até 1 minuto.</p>
        {isLoading ? <p role="status">Carregando vídeos…</p> : isError ? <div role="alert"><p>Não foi possível carregar os vídeos.</p><button className={`${actionClass} mt-3`} onClick={() => void refetch()}>Tentar novamente</button></div> : videos.length ? <div className="grid gap-5 xl:grid-cols-2">{videos.map(video => <VideoRow key={video.id} video={video} refresh={refresh} />)}</div> : <div className="rounded-xl border border-dashed border-gold/30 p-12 text-center"><Film className="mx-auto mb-4 h-9 w-9 text-gold" /><p>Nenhum vídeo na programação. Envie o primeiro ao lado.</p></div>}
      </section>
    </div>
  </div>;
}
