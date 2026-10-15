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
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1);
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
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1);
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
