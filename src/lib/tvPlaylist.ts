export interface TVVideo {
  fallback_url?: string | null;
  max_duration_seconds?: number | null;
  source_url?: string | null;
  credit?: string | null;
  source_type?: "file" | "youtube";
  youtube_id?: string | null;
  id: string;
  title: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  active: boolean;
  archived_at: string | null;
  fit: "contain" | "cover";
}

export const TV_BUCKET = "tv-videos";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function validateVideoFile(file: Pick<File, "name" | "type" | "size">): string | null {
  if (!file.size) return "O arquivo está vazio.";
  if (file.size > MAX_VIDEO_BYTES) return "Cada vídeo pode ter até 50 MB.";
  if (!((file.type === "video/mp4" && /\.mp4$/i.test(file.name)) ||
    (file.type === "video/webm" && /\.webm$/i.test(file.name)))) {
    return "Envie um vídeo MP4 ou WebM. Para TVs, prefira MP4 com H.264 e áudio AAC.";
  }
  return null;
}

export function playableVideos(videos: TVVideo[]): TVVideo[] {
  return videos.filter(video => video.active && !video.archived_at)
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

export function nextVideoId(videos: TVVideo[], currentId: string | null, failed = new Set<string>()): string | null {
  const playlist = playableVideos(videos);
  const start = playlist.findIndex(video => video.id === currentId);
  for (let offset = 1; offset <= playlist.length; offset++) {
    const candidate = playlist[(start + offset) % playlist.length];
    if (!failed.has(candidate.id)) return candidate.id;
  }
  return null;
}

/** A finite native duration wins unless the operator sets a shorter TV slot. */
export function playbackDuration(video: TVVideo, nativeDuration: number): number {
  const natural = Number.isFinite(nativeDuration) && nativeDuration > 0 ? nativeDuration : 0;
  const limit = video.max_duration_seconds;
  return limit && limit > 0 ? (natural ? Math.min(natural, limit) : limit) : natural;
}
