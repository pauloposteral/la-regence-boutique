import { useState, type CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { playableVideos, type TVVideo } from "@/lib/tvPlaylist";
import { describePresentation, PALETTES, resolvePairPresentation } from "@/lib/tvPlaybackPolicy";
import VideoThumbnail from "./VideoThumbnail";
import "./cinema.css";

/** Operator preview of previous/current/next using the same presentation policy
 *  as the live player. Posters only: it mounts no media decoders and is not
 *  live-screen telemetry. Paused and archived rows are outside the sequence. */
export default function AdjacentPreview({ videos }: { videos: TVVideo[] }) {
  const playlist = playableVideos(videos);
  const reducedMotion = usePrefersReducedMotion();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [open, setOpen] = useState(false);
  const index = Math.max(0, playlist.findIndex(video => video.id === currentId));
  if (!open) return <div className="mb-5"><button type="button" aria-expanded={false} className="inline-flex items-center rounded-full border border-gold/35 px-4 py-2 text-xs text-brown-dark hover:bg-gold/10" onClick={() => setOpen(true)}>Mostrar prévia da sequência (anterior · atual · próximo)</button></div>;
  if (playlist.length === 0) return <section aria-label="Prévia da sequência" className="mb-5 rounded-xl border border-dashed border-gold/30 p-4 text-sm text-muted-foreground">Prévia indisponível: nenhum vídeo ativo na programação.</section>;
  const at = (offset: number) => playlist[(index + offset + playlist.length) % playlist.length];
  const previous = at(-1), current = at(0), next = at(1);
  const presentation = resolvePairPresentation(next, current, { reducedMotion });
  const style = { "--tv-dissolve-duration": `${presentation.durationMs}ms`, "--tv-light-rgb": PALETTES[presentation.palette].rgb } as CSSProperties;
  const card = (video: TVVideo, label: string, extra = "") => <figure className="min-w-0 space-y-1.5">
    <figcaption className="text-[10px] uppercase tracking-[.2em] text-gold">{label}</figcaption>
    <div className={`relative aspect-video overflow-hidden rounded-lg bg-brown-deep ${extra}`}><VideoThumbnail video={video} /></div>
    <p className="truncate text-xs">{video.title}</p>
  </figure>;
  return <section aria-label="Prévia da sequência" className="mb-5 rounded-xl border border-gold/25 bg-white p-4">
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div><h3 className="text-base">Prévia da sequência</h3><p className="text-xs text-muted-foreground">Somente prévia no painel — não mostra o que a TV está exibindo agora.</p><button type="button" aria-expanded className="mt-1 text-xs underline decoration-gold/60 underline-offset-4" onClick={() => setOpen(false)}>Fechar prévia da sequência</button></div>
      <label className="space-y-1 text-xs text-muted-foreground"><span className="block">Vídeo atual da prévia</span>
        <select className="rounded-lg border border-input bg-white px-3 py-2 text-sm" value={current.id} onChange={event => setCurrentId(event.target.value)}>
          {playlist.map(video => <option key={video.id} value={video.id}>{video.title}</option>)}
        </select></label>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {card(previous, "Anterior")}
      {card(current, "Atual")}
      <div data-testid="preview-next" className="tv-cinema-stage relative" data-tv-transition={presentation.profile} style={style}>
        <figure className="min-w-0 space-y-1.5">
          <figcaption className="text-[10px] uppercase tracking-[.2em] text-gold">Próximo</figcaption>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-brown-deep">
            <div key={run} className={`absolute inset-0 ${run && !presentation.instant ? `tv-cinema-entering ${presentation.scale ? "tv-cinema-scale" : ""}` : ""}`}><VideoThumbnail video={next} /></div>
            {run > 0 && presentation.light && <div key={`light-${run}`} className="tv-cinema-light" aria-hidden="true" />}
          </div>
          <p className="truncate text-xs">{next.title}</p>
        </figure>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" className="inline-flex items-center rounded-full border border-gold/35 px-4 py-2 text-xs text-brown-dark hover:bg-gold/10" onClick={() => setRun(value => value + 1)}>Testar transição para o próximo</button>
      <p className="text-xs text-muted-foreground" data-testid="preview-policy">{describePresentation(presentation)}</p>
    </div>
  </section>;
}
