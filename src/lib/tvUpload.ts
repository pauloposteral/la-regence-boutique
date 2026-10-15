import { supabase } from "@/integrations/supabase/client";
import { TV_BUCKET, validateVideoFile } from "./tvPlaylist";

/** A small JPEG from the local file, without downloading or autoplaying the movie. */
export function createVideoPoster(file: File, signal: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Envio cancelado", "AbortError")); return; }
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    const finish = (error?: Error, blob?: Blob) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer); signal.removeEventListener("abort", abort);
      video.onloadedmetadata = null; video.onloadeddata = null; video.onseeked = null; video.onerror = null;
      video.removeAttribute("src"); video.load(); URL.revokeObjectURL(objectUrl);
      if (error) reject(error); else resolve(blob!);
    };
    const abort = () => finish(new DOMException("Envio cancelado", "AbortError"));
    const timer = setTimeout(() => finish(new Error("Não foi possível gerar a capa.")), 10_000);
    const capture = () => {
      if (settled || !video.videoWidth || !video.videoHeight) return;
      try {
        const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 180;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Capa indisponível neste navegador.");
        context.fillStyle = "#231a12"; context.fillRect(0, 0, 320, 180);
        const ratio = Math.min(320 / video.videoWidth, 180 / video.videoHeight);
        const width = video.videoWidth * ratio, height = video.videoHeight * ratio;
        context.drawImage(video, (320 - width) / 2, (180 - height) / 2, width, height);
        canvas.toBlob(blob => blob ? finish(undefined, blob) : finish(new Error("Capa indisponível.")), "image/jpeg", 0.78);
      } catch { finish(new Error("Não foi possível gerar a capa.")); }
    };
    video.preload = "auto"; video.muted = true; video.playsInline = true;
    video.onloadedmetadata = () => {
      const time = Math.min(1, video.duration / 2);
      if (Number.isFinite(time) && time > 0) video.currentTime = time;
      else if (video.readyState >= 2) capture();
    };
    video.onloadeddata = () => { if (video.currentTime === 0) capture(); };
    video.onseeked = capture;
    video.onerror = () => finish(new Error("Não foi possível gerar a capa."));
    signal.addEventListener("abort", abort, {once:true});
    video.src = objectUrl;
  });
}

export async function uploadTVPoster(file: File, videoPath: string, signal: AbortSignal): Promise<{path:string;url:string}> {
  const blob = await createVideoPoster(file, signal);
  if (signal.aborted) throw new DOMException("Envio cancelado", "AbortError");
  const path = videoPath.replace(/\.(mp4|webm)$/i, "") + ".jpg";
  const bucket = supabase.storage.from(TV_BUCKET);
  try {
    const {data:{session},error} = await supabase.auth.getSession();
    if (error || !session) throw new Error("Entre novamente com sua conta de administrador.");
    if (signal.aborted) throw new DOMException("Envio cancelado", "AbortError");
    await new Promise<void>((resolve,reject)=>{
      const request = new XMLHttpRequest();
      const abort = () => request.abort();
      const finish = (failure?:Error) => {signal.removeEventListener("abort",abort); if(failure) reject(failure); else resolve();};
      request.open("POST",`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${TV_BUCKET}/${path}`);
      request.timeout=15_000;
      request.setRequestHeader("Authorization",`Bearer ${session.access_token}`);
      request.setRequestHeader("apikey",import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      request.setRequestHeader("Content-Type","image/jpeg");
      request.setRequestHeader("Cache-Control","max-age=31536000");
      request.onload=()=>request.status>=200&&request.status<300?finish():finish(new Error("Não foi possível salvar a capa."));
      request.onerror=()=>finish(new Error("A conexão caiu ao salvar a capa."));
      request.ontimeout=()=>finish(new Error("O envio da capa demorou demais."));
      request.onabort=()=>finish(new DOMException("Envio cancelado","AbortError"));
      signal.addEventListener("abort",abort,{once:true}); request.send(blob);
    });
    if (signal.aborted) throw new DOMException("Envio cancelado", "AbortError");
    return {path,url:bucket.getPublicUrl(path).data.publicUrl};
  } catch(error) {
    // Best effort only: cleanup must never keep a cancelled upload pending.
    void bucket.remove([path]).catch(()=>{});
    throw error;
  }
}

/** Inspect the actual container in the browser before spending bandwidth on an upload. */
export function inspectVideo(file: File): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const cleanup = () => { clearTimeout(timer); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Não foi possível ler o vídeo. Exporte em MP4/H.264 e tente novamente.")); }, 15_000);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const result = { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
      cleanup();
      if (!result.width || !result.height || !Number.isFinite(result.duration) || result.duration <= 0) reject(new Error("Este arquivo não contém um vídeo válido."));
      else resolve(result);
    };
    video.onerror = () => { cleanup(); reject(new Error("Formato não reproduzível neste navegador. Prefira MP4/H.264 e áudio AAC.")); };
    video.src = url;
  });
}

/** XHR exposes real byte progress; authorization is also enforced by Storage RLS. */
export async function uploadTVVideo(file: File, signal: AbortSignal, onProgress: (percent: number) => void): Promise<{ path: string; url: string }> {
  const validation = validateVideoFile(file);
  if (validation) throw new Error(validation);
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error("Entre novamente com sua conta de administrador.");
  if (signal.aborted) throw new DOMException("Envio cancelado", "AbortError");
  const extension = file.type === "video/mp4" ? "mp4" : "webm";
  const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
  try {
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      const abort = () => request.abort();
      const finish = (failure?: Error) => { signal.removeEventListener("abort", abort); if (failure) reject(failure); else resolve(); };
      request.open("POST", `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${TV_BUCKET}/${path}`);
      request.timeout = 180_000;
      request.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      request.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      request.setRequestHeader("Content-Type", file.type);
      request.setRequestHeader("Cache-Control", "max-age=3600");
      request.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) finish();
        else finish(new Error(request.status === 413 ? "O servidor recusou o tamanho do vídeo. Envie um arquivo menor que 50 MB." : "Não foi possível enviar. Verifique sua conexão e se sua conta é administradora."));
      };
      request.onerror = () => finish(new Error("A conexão caiu durante o envio. Tente novamente."));
      request.ontimeout = () => finish(new Error("O envio demorou demais. Verifique a conexão e tente novamente."));
      request.onabort = () => finish(new DOMException("Envio cancelado", "AbortError"));
      signal.addEventListener("abort", abort, { once: true });
      request.send(file);
    });
    return { path, url: supabase.storage.from(TV_BUCKET).getPublicUrl(path).data.publicUrl };
  } catch (error) {
    // Removes a completed object if cancellation raced with the server response.
    await supabase.storage.from(TV_BUCKET).remove([path]);
    throw error;
  }
}
