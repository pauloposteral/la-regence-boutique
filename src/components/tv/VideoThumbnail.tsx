import { useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import type { TVVideo } from '@/lib/tvPlaylist';

function posterSource(video: TVVideo): string | null {
  if (video.source_type === 'youtube' && /^[\w-]{11}$/.test(video.youtube_id ?? '')) {
    return `https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`;
  }
  const value = video.poster_url;
  if (!value) return null;
  if (/^\/tv-thumbnails\/[\w-]+\.jpg$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export default function VideoThumbnail({ video }: { video: TVVideo }) {
  const source = posterSource(video);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);
  return source && !failed
    ? <img src={source} alt={`Capa: ${video.title}`} loading="lazy" decoding="async" width={160} height={90} className="h-full w-full object-cover" onError={() => setFailed(true)} />
    : <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-brown-deep text-white/70"><Film size={20} aria-hidden="true" /><span className="text-[10px]">Sem capa</span></span>;
}
