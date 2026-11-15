import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TVPlayer from './TVPlayer';
import CinematicStage from './CinematicStage';
import type { TVVideo } from '@/lib/tvPlaylist';
import type { YouTubeAPI } from '@/lib/youtubePlayer';

const file: TVVideo = { id: 'coffee', title: 'Café da casa', url: 'https://example.com/coffee.mp4', source_type: 'file', storage_path: null, sort_order: 1, active: true, archived_at: null, fit: 'contain' };
const youtube: TVVideo = { ...file, id: 'external', title: 'Mkt coffee', url: 'https://www.youtube.com/watch?v=0jIeCAOkgcQ', source_type: 'youtube', youtube_id: '0jIeCAOkgcQ', sort_order: 0 };

// Only the external provider is substituted: the actual stage, controls,
// source cooldown, watchdog and shuffle all run in these regressions.
function provider() {
  let options!: ConstructorParameters<YouTubeAPI['Player']>[1];
  const player = { playVideo: vi.fn(), pauseVideo: vi.fn(), seekTo: vi.fn(), mute: vi.fn(), unMute: vi.fn(), destroy: vi.fn(), getCurrentTime: vi.fn(() => 0), getDuration: vi.fn(() => 35) };
  window.YT = { Player: vi.fn(function (_element, settings) { options = settings; return player; }) as unknown as YouTubeAPI['Player'] };
  return { player, get events() { return options.events; } };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
});
afterEach(() => { cleanup(); delete window.YT; vi.restoreAllMocks(); vi.useRealTimers(); });

describe('TV startup without a presented frame', () => {
  it('shows preparation until the first frame instead of an empty stage', () => {
    render(<TVPlayer videos={[file]} />);
    expect(screen.getByText('Preparando a programação…')).toBeInTheDocument();
    fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
    expect(screen.queryByText('Preparando a programação…')).not.toBeInTheDocument();
  });

  it('does not report duration-only YouTube metadata at zero as playback progress', async () => {
    const yt = provider();
    const onProgress = vi.fn();
    await act(async () => { render(<CinematicStage video={youtube} paused={false} muted onReady={() => {}} onProgress={onProgress} onEnded={() => {}} onError={() => {}} onBlocked={() => {}} />); });
    act(() => { yt.events.onReady(); vi.advanceTimersByTime(2000); });
    expect(onProgress).not.toHaveBeenCalled();
    yt.player.getCurrentTime.mockReturnValue(0.5);
    act(() => vi.advanceTimersByTime(1000));
    expect(onProgress).toHaveBeenCalledExactlyOnceWith(0.5, 35);
  });

  it('moves from an unstarted YouTube item to the next source after 12 seconds', async () => {
    const yt = provider();
    await act(async () => { render(<TVPlayer videos={[youtube, file]} initialId={youtube.id} />); });
    act(() => { yt.events.onReady(); vi.advanceTimersByTime(11_000); });
    expect(screen.getByLabelText('YouTube: Mkt coffee')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText('Vídeo em exibição')).toHaveAttribute('src', file.url);
    fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect(screen.getByLabelText('Vídeo em exibição')).toHaveAttribute('src', file.url);
    expect(screen.queryByLabelText('YouTube: Mkt coffee')).not.toBeInTheDocument();
  });

  it('continues the unattended playlist when YouTube blocks both autoplay attempts', async () => {
    const yt = provider();
    await act(async () => { render(<TVPlayer videos={[youtube, file]} initialId={youtube.id} />); });
    act(() => { yt.events.onReady(); yt.events.onAutoplayBlocked(); vi.advanceTimersByTime(500); yt.events.onAutoplayBlocked(); });
    expect(screen.getByRole('button', { name: 'Iniciar reprodução' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(11_500));
    expect(screen.getByLabelText('Vídeo em exibição')).toHaveAttribute('src', file.url);
    expect(screen.queryByRole('button', { name: 'Iniciar reprodução' })).not.toBeInTheDocument();
  });

  it('preserves an operator pause and gives a resumed YouTube source a fresh startup window', async () => {
    const yt = provider();
    await act(async () => { render(<TVPlayer videos={[youtube, file]} initialId={youtube.id} />); });
    act(() => { yt.events.onReady(); vi.advanceTimersByTime(4000); });
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByLabelText('YouTube: Mkt coffee')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir' }));
    act(() => vi.advanceTimersByTime(11_000));
    expect(screen.getByLabelText('YouTube: Mkt coffee')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText('Vídeo em exibição')).toHaveAttribute('src', file.url);
  });

  it('does not apply the startup deadline after genuine YouTube playback begins', async () => {
    const yt = provider();
    await act(async () => { render(<TVPlayer videos={[youtube, file]} initialId={youtube.id} />); });
    act(() => { yt.events.onReady(); yt.events.onStateChange({ data: 1 }); });
    for (let time = 1; time <= 20; time++) {
      yt.player.getCurrentTime.mockReturnValue(time);
      act(() => vi.advanceTimersByTime(1000));
    }
    expect(screen.getByLabelText('YouTube: Mkt coffee')).toBeInTheDocument();
    expect(screen.queryByText('Preparando a programação…')).not.toBeInTheDocument();
  });

  it('keeps the visible title until the incoming video actually presents a frame', () => {
    const next = { ...file, id: 'pizza', title: 'Mini Pizzas', url: 'https://example.com/pizza.mp4', sort_order: 2 };
    render(<TVPlayer videos={[file, next]} />);
    fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    expect(screen.getByText('Café da casa', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Preparando: Mini Pizzas')).toBeInTheDocument();
    fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
    expect(screen.getByText('Mini Pizzas', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('Café da casa', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText('Preparando: Mini Pizzas')).not.toBeInTheDocument();
  });

  it('does not attach an incoming progress bar to the retained outgoing frame', () => {
    const next = { ...file, id: 'pizza', title: 'Mini Pizzas', url: 'https://example.com/pizza.mp4', sort_order: 2 };
    render(<TVPlayer videos={[file, next]} />);
    fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
    fireEvent.ended(screen.getByLabelText('Vídeo em exibição'));
    const preparing = screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
    Object.defineProperty(preparing, 'duration', { configurable: true, value: 20 });
    preparing.currentTime = 1;
    fireEvent.timeUpdate(preparing);
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar controles da TV' }));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    fireEvent.playing(preparing);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  it('clears the last presented title when an empty playlist removes its frame', () => {
    const next = { ...file, id: 'pizza', title: 'Mini Pizzas', url: 'https://example.com/pizza.mp4' };
    const view = render(<TVPlayer videos={[file]} />);
    fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
    view.rerender(<TVPlayer videos={[]} />);
    view.rerender(<TVPlayer videos={[next]} />);
    expect(screen.queryByText('Café da casa', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText('Mini Pizzas', { exact: true })).toBeInTheDocument();
  });
});
