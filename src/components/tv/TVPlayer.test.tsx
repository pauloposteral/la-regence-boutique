import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TVPlayer from "./TVPlayer";
import type { TVVideo } from "@/lib/tvPlaylist";

const videos: TVVideo[] = ["cafe", "produto"].map((id, i) => ({
  id, title: id, url: `https://example.com/${id}.mp4`, storage_path: null,
  sort_order: i, active: true, archived_at: null, fit: "contain",
}));

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("TV playback", () => {
  it('does not resume an operator-paused video when entering fullscreen', async () => {
    render(<TVPlayer videos={videos} />);
    const stage=screen.getByLabelText('TV La Régence');
    stage.requestFullscreen=vi.fn().mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole('button',{name:'Pausar'}));
    const calls=vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;
    await act(async () => { fireEvent.click(screen.getByRole('button',{name:'Tela cheia'})); });
    expect(stage.requestFullscreen).toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(calls);
    expect(screen.getByRole('button',{name:'Reproduzir'})).toBeInTheDocument();
  });
  it('starts with a clean screen and reveals progress only for operator interaction', () => {
    vi.useFakeTimers();
    render(<TVPlayer videos={videos} />);
    const video=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
    Object.defineProperty(video,'duration',{configurable:true,value:20});
    video.currentTime=5;
    fireEvent.playing(video);
    fireEvent.timeUpdate(video);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('group',{name:'Controles da TV'})).toHaveClass('opacity-0');
    fireEvent.click(screen.getByRole('button',{name:'Mostrar controles da TV'}));
    expect(screen.getByRole('progressbar',{name:'Progresso do vídeo'})).toHaveAttribute('aria-valuenow','5');
    expect(screen.getByRole('group',{name:'Controles da TV'})).toHaveClass('opacity-100');
    act(() => vi.advanceTimersByTime(4500));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
  it('shows all fourteen sources once before restarting the cycle', () => {
    const list=Array.from({length:14},(_,i)=>({...videos[0],id:`clip-${i}`,url:`https://example.com/clip-${i}.mp4`,sort_order:i}));
    render(<TVPlayer videos={list} />);
    const shown:string[]=[];
    for(let i=0;i<14;i++) {
      const media=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
      shown.push(media.src);
      fireEvent.ended(media);
    }
    expect(shown).toEqual(list.map(v=>v.url));
    expect(new Set(shown).size).toBe(14);
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toBe(list[0].url);
  });
  it('does not repeat an already shown video when the admin reorders the playlist', () => {
    const list=[...videos,{...videos[0],id:'terceiro',title:'terceiro',url:'https://example.com/terceiro.mp4',sort_order:2}];
    const view=render(<TVPlayer videos={list} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('produto.mp4');
    view.rerender(<TVPlayer videos={list.map(v=>({...v,sort_order:v.id==='produto'?0:v.id==='cafe'?1:2}))} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('terceiro.mp4');
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('produto.mp4');
  });
  it('selects an unseen video when the currently playing row is removed', () => {
    const third={...videos[0],id:'terceiro',title:'terceiro',url:'https://example.com/terceiro.mp4',sort_order:2};
    const view=render(<TVPlayer videos={[...videos,third]} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    view.rerender(<TVPlayer videos={[videos[0],third]} />);
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('terceiro.mp4');
  });
  it('keeps the current source when a new video is inserted ahead of it', () => {
    const view=render(<TVPlayer videos={videos} />);
    const first=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
    first.currentTime=3;
    const added={...videos[0],id:'novo',url:'https://example.com/novo.mp4',sort_order:-1};
    view.rerender(<TVPlayer videos={[added,...videos]} />);
    expect(screen.getByLabelText('Vídeo em exibição')).toBe(first);
    expect(first.currentTime).toBe(3);
  });
  it('skips duplicate sources in the public sequence', () => {
    render(<TVPlayer videos={[videos[0],{...videos[0],id:'copy',sort_order:0.5},videos[1]]} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('produto.mp4');
    expect(screen.getByText(/2 de 2 · Sequência automática/)).toBeInTheDocument();
  });
  it.each(['https://example.com/cafe.mp4', 'https://EXAMPLE.com:443/cafe.mp4#preview'])('does not restart an equivalent source when its representative changes: %s', url => {
    const copy={...videos[0],id:'copy',sort_order:2,url};
    const view=render(<TVPlayer videos={[...videos,copy]} />);
    const media=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
    media.currentTime=3;
    view.rerender(<TVPlayer videos={[...videos,{...copy,sort_order:-1}]} />);
    expect(screen.getByLabelText('Vídeo em exibição')).toBe(media);
    expect(media.currentTime).toBe(3);
    expect(vi.mocked(HTMLMediaElement.prototype.load).mock.contexts.filter(context => context === media)).toHaveLength(1);
  });
  it('keeps the cycle history after a manual refresh', async () => {
    const third={...videos[0],id:'terceiro',title:'terceiro',url:'https://example.com/terceiro.mp4',sort_order:2};
    const refresh=vi.fn().mockResolvedValue(undefined);
    const view=render(<TVPlayer videos={[...videos,third]} onRefresh={refresh} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Atualizar programação'}));});
    view.rerender(<TVPlayer videos={[{...videos[1],sort_order:0},{...videos[0],sort_order:1},third]} onRefresh={refresh} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('terceiro.mp4');
  });
  it('includes a newly added source before repeating sources from the current cycle', () => {
    const view=render(<TVPlayer videos={videos} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    const added={...videos[0],id:'novo',url:'https://example.com/novo.mp4',sort_order:-1};
    view.rerender(<TVPlayer videos={[added,...videos]} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('novo.mp4');
  });
  it('does not reselect a failed source ahead of unseen healthy sources after an update', () => {
    const third={...videos[0],id:'terceiro',url:'https://example.com/terceiro.mp4',sort_order:2};
    const view=render(<TVPlayer videos={[...videos,third]} />);
    fireEvent.error(screen.getByLabelText('Vídeo em exibição'));
    view.rerender(<TVPlayer videos={[{...videos[1],sort_order:0},{...videos[0],sort_order:1},third]} />);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('terceiro.mp4');
  });
  it("starts muted and advances/wraps when videos end", () => {
    render(<TVPlayer videos={videos} />);
    const media = screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement;
    expect(media.muted).toBe(true);
    expect(media.src).toBe("https://example.com/cafe.mp4");
    fireEvent.ended(media);
    expect((screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement).src).toBe("https://example.com/produto.mp4");
    fireEvent.ended(screen.getByLabelText("Vídeo em exibição"));
    expect((screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement).src).toBe("https://example.com/cafe.mp4");
  });
  it("skips a broken video and shows a recovery screen if none can play", () => {
    render(<TVPlayer videos={videos} />);
    fireEvent.error(screen.getByLabelText("Vídeo em exibição"));
    expect((screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement).src).toContain("produto.mp4");
    fireEvent.error(screen.getByLabelText("Vídeo em exibição"));
    expect(screen.getByText(/Tentando retomar/)).toBeInTheDocument();
  });
  it("keeps an empty playlist honest instead of replaying deactivated videos", () => {
    render(<TVPlayer videos={[]} />);
    expect(screen.getByText(/Nenhum vídeo ativo/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Vídeo em exibição")).not.toBeInTheDocument();
  });
  it("shows an actionable play button if autoplay is denied", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new DOMException("blocked", "NotAllowedError"));
    await act(async () => { render(<TVPlayer videos={videos} />); });
    expect(screen.getByRole("button", { name: "Iniciar reprodução" })).toBeInTheDocument();
  });
  it("skips a stalled file after 30 seconds and retries after the playlist is exhausted", async () => {
    vi.useFakeTimers();
    render(<TVPlayer videos={videos} />);
    act(() => { vi.advanceTimersByTime(35_000); });
    expect((screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement).src).toContain("produto.mp4");
    act(() => { vi.advanceTimersByTime(35_000); });
    expect(screen.getByText(/Tentando retomar/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(30_000); });
    expect((screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement).src).toContain("cafe.mp4");
    await act(async () => {});
  });
  it("preserves playback position when pausing and ignores watchdog while paused", async () => {
    vi.useFakeTimers();
    render(<TVPlayer videos={videos} />);
    const media = screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement;
    media.currentTime = 12;
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    act(() => { vi.advanceTimersByTime(45_000); });
    expect(media.src).toContain("cafe.mp4");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reproduzir" })); });
    expect(media.currentTime).toBe(12);
    expect(vi.mocked(HTMLMediaElement.prototype.load).mock.contexts.filter(context => context === media)).toHaveLength(1);
  });
});
  it('starts the requested active item for the admin preview link', () => {
    render(<TVPlayer videos={videos} initialId="produto" />);
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('produto.mp4');
    expect(screen.getByText(/2 de 2 · Sequência automática/)).toBeInTheDocument();
  });
  it('offers a manual playlist refresh without reloading the entire site', async () => {
    const refresh=vi.fn(); render(<TVPlayer videos={videos} onRefresh={refresh} />);
    await act(async () => { fireEvent.click(screen.getByRole('button',{name:'Atualizar programação'})); }); expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('keeps manual refresh pending until the request resolves', async () => {
    let finish!: () => void;
    const request = new Promise<void>(resolve => { finish = resolve; });
    render(<TVPlayer videos={videos} onRefresh={() => request} />);
    fireEvent.click(screen.getByRole('button', {name:'Atualizar programação'}));
    expect(screen.getByRole('status')).toHaveTextContent('Atualizando a programação…');
    expect(screen.getByRole('button', {name:'Atualizar programação'})).toBeDisabled();
    await act(async () => { finish(); await request; });
    expect(screen.getByRole('status')).toHaveTextContent('Programação atualizada.');
    expect(screen.getByRole('button', {name:'Atualizar programação'})).toBeEnabled();
  });
  it('reports a failed refresh while keeping the current video', async () => {
    render(<TVPlayer videos={videos} onRefresh={async () => { throw new Error('offline'); }} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', {name:'Atualizar programação'})); });
    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível atualizar');
    expect(screen.queryByText('Programação atualizada.')).not.toBeInTheDocument();
    expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toContain('cafe.mp4');
    expect(screen.getByRole('button', {name:'Atualizar programação'})).toBeEnabled();
  });
  it('prepares the next item before the current one ends and hands off to the same element', () => {
    const view = render(<TVPlayer videos={videos} />);
    fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
    const prepared = view.container.querySelector('[data-tv-deck="produto"] video') as HTMLVideoElement;
    expect(prepared).toBeInTheDocument();
    expect(prepared.parentElement).toHaveAttribute('data-tv-phase', 'preparing');
    expect(view.container.querySelectorAll('[data-tv-deck]')).toHaveLength(2);
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect(screen.getByLabelText('Vídeo em exibição')).toBe(prepared);
    expect(view.container.querySelectorAll('[data-tv-deck]').length).toBeLessThanOrEqual(2);
  });
  it('keeps a source cooldown through unrelated updates and reorders, then retries it alone without restarting the current video', () => {
    vi.useFakeTimers();
    const three: TVVideo[] = ['a', 'b', 'c'].map((id, i) => ({ ...videos[0], id, title: id, url: `https://example.com/${id}.mp4`, sort_order: i }));
    const view = render(<TVPlayer videos={three} />);
    const current = () => screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
    fireEvent.error(current()); // a fails (no fallback)
    expect(current().src).toContain('b.mp4');
    // Unrelated poll with new metadata and a reorder; plus an alias row of the failed source.
    const reordered = [{ ...three[2], sort_order: 0, title: 'c novo' }, { ...three[1], sort_order: 1 }, { ...three[0], sort_order: 2 }, { ...three[0], id: 'a-alias', sort_order: 3 }];
    view.rerender(<TVPlayer videos={reordered} />);
    expect(current().src).toContain('b.mp4');
    fireEvent.playing(current()); act(() => { vi.advanceTimersByTime(1300); }); fireEvent.ended(current());
    expect(current().src).toContain('c.mp4');
    fireEvent.playing(current()); act(() => { vi.advanceTimersByTime(1300); }); fireEvent.ended(current());
    expect(current().src).toContain('b.mp4'); // a and its alias still cooling
    const healthy = current();
    fireEvent.playing(healthy); act(() => { vi.advanceTimersByTime(1300); });
    const loads = () => vi.mocked(HTMLMediaElement.prototype.load).mock.contexts.filter(context => context === healthy).length;
    const before = loads();
    healthy.currentTime = 7;
    // The healthy video keeps reporting progress while a's cooldown expires.
    for (let step = 1; step <= 13; step++) { healthy.currentTime = 7 + step; fireEvent.timeUpdate(healthy); act(() => { vi.advanceTimersByTime(5_000); }); }
    expect(current()).toBe(healthy);
    expect(healthy.currentTime).toBe(20);
    expect(loads()).toBe(before);
    fireEvent.ended(healthy);
    expect(current().src).toContain('a.mp4'); // retried independently
  });

describe("per-source cooldown (review fix round 1)", () => {
  const three: TVVideo[] = ["a", "b", "c"].map((id, i) => ({ ...videos[0], id, title: id, url: `https://example.com/${id}.mp4`, sort_order: i }));
  const shown = () => (screen.queryByLabelText("Vídeo em exibição") as HTMLVideoElement | null)?.src ?? null;
  it("keeps the 60s floor for every source when all sources failed", () => {
    vi.useFakeTimers();
    render(<TVPlayer videos={videos} />);
    fireEvent.error(screen.getByLabelText("Vídeo em exibição"));
    fireEvent.error(screen.getByLabelText("Vídeo em exibição"));
    expect(shown()).toBeNull();
    act(() => { vi.advanceTimersByTime(30_010); });
    expect(shown()).toBeNull();
    act(() => { vi.advanceTimersByTime(30_100); });
    expect(shown()).toContain("cafe.mp4");
  });
  it("re-enables staggered failures at their own expiry and escalates repeat failures", () => {
    vi.useFakeTimers();
    render(<TVPlayer videos={videos} />);
    fireEvent.error(screen.getByLabelText("Vídeo em exibição")); // cafe until 60s
    act(() => { vi.advanceTimersByTime(20_000); });
    fireEvent.error(screen.getByLabelText("Vídeo em exibição")); // produto until 80s
    act(() => { vi.advanceTimersByTime(40_100); });
    expect(shown()).toContain("cafe.mp4");
    fireEvent.error(screen.getByLabelText("Vídeo em exibição")); // cafe 2nd failure: 120s
    expect(shown()).toBeNull();
    act(() => { vi.advanceTimersByTime(20_000); });
    expect(shown()).toContain("produto.mp4");
    fireEvent.error(screen.getByLabelText("Vídeo em exibição")); // produto 2nd: 120s
    act(() => { vi.advanceTimersByTime(61_000); });
    expect(shown()).toBeNull();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(shown()).not.toBeNull();
  });
  it("retains the healthy current source through unrelated updates while another source cools", () => {
    vi.useFakeTimers();
    const view = render(<TVPlayer videos={three} />);
    fireEvent.error(screen.getByLabelText("Vídeo em exibição")); // a cools
    const healthy = screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement;
    expect(healthy.src).toContain("b.mp4");
    fireEvent.playing(healthy); act(() => { vi.advanceTimersByTime(1_300); });
    // Healthy playback keeps progressing so only the cooldown, not the watchdog, matters.
    const playFor = (ms: number) => { for (let t = 0; t < ms; t += 5_000) { healthy.currentTime += 5; fireEvent.timeUpdate(healthy); act(() => { vi.advanceTimersByTime(5_000); }); } };
    view.rerender(<TVPlayer videos={[...three].reverse().map((v, i) => ({ ...v, sort_order: i, title: `${v.title}!` }))} />);
    playFor(30_000);
    view.rerender(<TVPlayer videos={three.map(v => ({ ...v }))} />);
    playFor(35_000); // a's own 60s cooldown expires meanwhile
    expect(screen.getByLabelText("Vídeo em exibição")).toBe(healthy);
  });
});

