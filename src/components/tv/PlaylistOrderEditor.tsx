import { useRef, useState } from "react";
import type { QueryObserverResult } from "@tanstack/react-query";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, GripVertical, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TVVideo } from "@/lib/tvPlaylist";
import VideoThumbnail from "./VideoThumbnail";

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold/35 px-4 py-2 text-sm hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50";
const catalogOrder = (videos: TVVideo[]) => videos.filter(video => !video.archived_at)
  .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

function OrderItem({ video, index, count, disabled, onMove }: {
  video: TVVideo; index: number; count: number; disabled: boolean; onMove(index: number): void;
}) {
  const dragControls = useDragControls();
  const reducedMotion = useReducedMotion();
  return <Reorder.Item value={video.id} dragListener={false} dragControls={dragControls}
    drag={disabled ? false : "y"} transition={{ duration: reducedMotion ? 0 : 0.18 }}
    aria-label={video.title} className="relative rounded-xl border border-gold/25 bg-white p-3">
    <div className="flex items-center gap-2 sm:gap-3">
      <button type="button" disabled={disabled} aria-label={`Arrastar ${video.title}`} aria-describedby="playlist-order-instructions"
        className="flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
        onPointerDown={event => { if (!disabled) dragControls.start(event); }}
        onKeyDown={event => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault(); onMove(index + (event.key === "ArrowUp" ? -1 : 1));
        }}><GripVertical size={20} /></button>
      <div className="aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-brown-deep sm:w-24"><VideoThumbnail video={video} /></div>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{video.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{video.active ? "Na programação" : "Pausado · mantém esta posição ao ativar"}</p></div>
    </div>
    <div className="mt-2 flex items-center justify-end gap-2">
      <label className="mr-auto flex items-center gap-2 text-xs text-muted-foreground"><span>Posição</span>
        <select aria-label={`Posição de ${video.title}`} disabled={disabled} value={index + 1}
          className="min-h-11 rounded-lg border border-input bg-white px-2 text-sm text-brown-dark focus:outline-none focus:ring-2 focus:ring-gold"
          onChange={event => onMove(Number(event.target.value) - 1)}>
          {Array.from({ length: count }, (_, position) => <option key={position} value={position + 1}>{position + 1}</option>)}
        </select></label>
      <button type="button" disabled={disabled || index === 0} className={`${buttonClass} px-3`} aria-label={`Mover ${video.title} para cima`} onClick={() => onMove(index - 1)}><ArrowUp size={16} /><span className="hidden sm:inline">Subir</span></button>
      <button type="button" disabled={disabled || index === count - 1} className={`${buttonClass} px-3`} aria-label={`Mover ${video.title} para baixo`} onClick={() => onMove(index + 1)}><ArrowDown size={16} /><span className="hidden sm:inline">Descer</span></button>
    </div>
  </Reorder.Item>;
}

export default function PlaylistOrderEditor({ videos, refresh, onClose }: {
  videos: TVVideo[];
  refresh(): Promise<Pick<QueryObserverResult<TVVideo[], Error>, "data" | "isError" | "error">>;
  onClose(): void;
}) {
  const latestProps = useRef(videos); latestProps.current = videos;
  const [snapshot, setSnapshot] = useState(() => ({ videos: catalogOrder(videos), observedVideos: videos }));
  // A refetch may finish before its data reaches the parent props. Keep the
  // confirmed result until that older prop reference is replaced.
  const latest = videos === snapshot.observedVideos ? snapshot.videos : catalogOrder(videos);
  const expected = snapshot.videos.map(video => video.id);
  const [order, setOrder] = useState(expected);
  const [operation, setOperation] = useState<"save" | "reload" | null>(null);
  const busy = operation !== null;
  const [error, setError] = useState("");
  const [serverConflict, setServerConflict] = useState(false);
  const conflict = serverConflict || !sameOrder(expected, latest.map(video => video.id));
  const changed = !sameOrder(order, expected);
  const catalog = new Map([...snapshot.videos, ...latest].map(video => [video.id, video]));

  const move = (id: string, destination: number) => {
    if (busy || conflict || destination < 0 || destination >= order.length) return;
    const next = [...order];
    const source = next.indexOf(id);
    if (source < 0 || source === destination) return;
    next.splice(source, 1); next.splice(destination, 0, id);
    setOrder(next); setError("");
  };
  const reload = async () => {
    if (busy) return;
    setOperation("reload"); setError("");
    try {
      const result = await refresh();
      if (result.isError !== false || result.error !== null || !Array.isArray(result.data)) {
        throw new Error("A programação não pôde ser recarregada.");
      }
      const confirmed = catalogOrder(result.data);
      setSnapshot({ videos: confirmed, observedVideos: latestProps.current });
      setOrder(confirmed.map(video => video.id));
      setServerConflict(false); setError("");
    } catch {
      setServerConflict(true);
      setError("Não foi possível recarregar a ordem. Seu rascunho foi mantido; confira a conexão e tente novamente.");
    } finally { setOperation(null); }
  };
  const save = async () => {
    if (busy || conflict || !changed) return;
    setOperation("save"); setError("");
    try {
      const { error: saveError } = await supabase.rpc("reorder_tv_videos", {
        p_ordered_ids: order, p_expected_ids: expected,
      });
      if (saveError) {
        if (saveError.code === "40001") {
          setServerConflict(true);
          await refresh().catch(() => {});
          return;
        }
        throw saveError;
      }
      // A confirmed write stays successful even if this browser's refresh fails.
      await refresh().catch(() => {});
      toast.success("Ordem salva. A TV conectada atualiza a sequência automaticamente.");
      onClose();
    } catch {
      setError("Não foi possível salvar a ordem. Seu rascunho foi mantido; confira a conexão e tente novamente.");
    } finally { setOperation(null); }
  };

  return <div className="rounded-xl border border-gold/30 bg-cream p-3 sm:p-5">
    <h3 className="text-lg font-medium">Escolha a sequência</h3>
    <p id="playlist-order-instructions" className="mt-2 text-sm leading-relaxed text-muted-foreground">Arraste pela alça, use as setas ou escolha a posição. A ordem só muda na TV depois de salvar. Vídeos pausados ficam fora da reprodução.</p>
    {conflict && <div role="alert" className="mt-4 rounded-lg border border-gold/40 bg-white p-3 text-sm">
      <p>A programação mudou enquanto você organizava. Recarregue a ordem para incluir as alterações antes de salvar.</p>
      <button type="button" className={`${buttonClass} mt-3`} disabled={busy} onClick={() => void reload()}><RefreshCw size={16} className={operation === "reload" ? "animate-spin" : undefined} />{operation === "reload" ? "Recarregando ordem…" : "Recarregar ordem"}</button>
    </div>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    <Reorder.Group as="ol" axis="y" layoutScroll values={order} aria-label="Ordem de exibição"
      onReorder={next => { if (!busy && !conflict) { setOrder(next); setError(""); } }}
      className="my-4 max-h-[65vh] space-y-2 overflow-y-auto p-1">
      {order.map((id, index) => <OrderItem key={id} video={catalog.get(id)!} index={index} count={order.length}
        disabled={busy || conflict} onMove={destination => move(id, destination)} />)}
    </Reorder.Group>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={busy || conflict || !changed} className={`${buttonClass} bg-gold text-white hover:bg-gold-dark`} onClick={() => void save()}><Check size={16} />{operation === "save" ? "Salvando ordem…" : "Salvar ordem"}</button>
      <button type="button" disabled={busy} className={buttonClass} onClick={onClose}>Cancelar organização</button>
      <p aria-live="polite" className="text-xs text-muted-foreground">{changed ? "Alterações ainda não salvas" : "Esta é a ordem salva"}</p>
    </div>
  </div>;
}
