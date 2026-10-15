import { supabase } from "@/integrations/supabase/client";
import { TV_BUCKET, validateVideoFile } from "./tvPlaylist";

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
