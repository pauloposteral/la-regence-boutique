export function parseYouTubeUrl(input: string): { id: string; url: string } | null {
  let url: URL;
  try {
    const value = input.trim();
    url = new URL(/^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(value) ? `https://${value}` : value);
  } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  const path = url.pathname.split('/').filter(Boolean);
  let id: string | null = null;
  if (host === 'youtu.be' && path.length === 1) id = path[0];
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    if (path.length === 1 && path[0] === 'watch') id = url.searchParams.get('v');
    if (path.length === 2 && ['shorts', 'embed', 'live'].includes(path[0])) id = path[1];
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { id, url: `https://www.youtube.com/watch?v=${id}` } : null;
}
