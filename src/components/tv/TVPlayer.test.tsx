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
