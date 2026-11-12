import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CinematicStage from './CinematicStage';
import type { TVVideo } from '@/lib/tvPlaylist';
import type { YouTubeAPI } from '@/lib/youtubePlayer';
const first: TVVideo = { id:'one', title:'Um', url:'https://example.com/1.mp4', fit:'contain', storage_path:null, sort_order:0, active:true, archived_at:null };
const second = { ...first, id:'two', url:'https://example.com/2.mp4' };
const callbacks = () => ({onReady:vi.fn(),onPaused:vi.fn(),onProgress:vi.fn(),onEnded:vi.fn(),onError:vi.fn(),onBlocked:vi.fn()});
beforeEach(() => { vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(() => {}); vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(() => {}); vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(); });
afterEach(() => { cleanup(); delete window.YT; vi.restoreAllMocks(); vi.useRealTimers(); });
it('preserves a media start fragment in the native playback source', () => {
 const events=callbacks();
 render(<CinematicStage video={{...first,url:'https://EXAMPLE.com:443/1.mp4#t=30'}} paused={false} muted {...events} />);
 expect((screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement).src).toBe('https://example.com/1.mp4#t=30');
});
it('holds the outgoing frame until incoming playback and ignores outgoing events', () => {
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const old=screen.getByLabelText('Vídeo em exibição'); fireEvent.playing(old);
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 expect(old).toBeInTheDocument(); expect(old.parentElement).toHaveAttribute('data-visible','true');
 fireEvent.ended(old); fireEvent.error(old); expect(events.onEnded).not.toHaveBeenCalled(); expect(events.onError).not.toHaveBeenCalled();
 const incoming=screen.getByLabelText('Vídeo em exibição'); fireEvent.playing(incoming);
 expect(incoming.parentElement).toHaveAttribute('data-visible','true'); expect(old.parentElement).toHaveAttribute('data-visible','false');
});

it('retains the outgoing frame across a metadata refresh until the dissolve completes', () => {
 vi.useFakeTimers();
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const outgoing=screen.getByLabelText('Vídeo em exibição'); fireEvent.playing(outgoing);
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 act(()=>vi.advanceTimersByTime(400));
 view.rerender(<CinematicStage video={{...second,title:'Metadados atualizados'}} paused={false} muted {...events} />);
 expect(outgoing).toBeInTheDocument();
 act(()=>vi.advanceTimersByTime(900));
 expect(outgoing).not.toBeInTheDocument();
 expect(screen.getByLabelText('Vídeo em exibição')).toHaveAttribute('src',second.url);
});

it('releases the outgoing decoder after a completed dissolve', () => {
 vi.useFakeTimers();
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const outgoing=screen.getByLabelText('Vídeo em exibição'); fireEvent.playing(outgoing);
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 expect(view.container.querySelectorAll('[data-tv-deck]')).toHaveLength(2);
 act(()=>vi.advanceTimersByTime(1300));
 expect(outgoing).not.toBeInTheDocument();
 expect(view.container.querySelectorAll('[data-tv-deck]')).toHaveLength(1);
});

it('queues rapid skips until the current dissolve completes without mounting a third decoder', () => {
 vi.useFakeTimers();
 const events=callbacks();
 const third={...first,id:'three',url:'https://example.com/3.mp4'};
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 view.rerender(<CinematicStage video={third} paused={false} muted {...events} />);
 expect(view.container.querySelector('[data-tv-deck="one"]')).toBeInTheDocument();
 expect(view.container.querySelector('[data-tv-deck="three"]')).not.toBeInTheDocument();
 expect(view.container.querySelectorAll('[data-tv-deck]')).toHaveLength(2);
 act(()=>vi.advanceTimersByTime(1300));
 expect(view.container.querySelector('[data-tv-deck="one"]')).not.toBeInTheDocument();
 expect(screen.getByLabelText('Vídeo em exibição')).toHaveAttribute('src',third.url);
});

it('freezes an in-flight dissolve while the operator pauses and resumes its remaining time', () => {
 vi.useFakeTimers();
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const outgoing=screen.getByLabelText('Vídeo em exibição'); fireEvent.playing(outgoing);
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 act(()=>vi.advanceTimersByTime(400));
 view.rerender(<CinematicStage video={second} paused muted {...events} />);
 act(()=>vi.advanceTimersByTime(5000));
 expect(outgoing).toBeInTheDocument();
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 act(()=>vi.advanceTimersByTime(900));
 expect(outgoing).not.toBeInTheDocument();
});

it('ignores late playing events while paused and holds the last good frame through an incoming error', () => {
 const events=callbacks();
 const third={...first,id:'three',url:'https://example.com/3.mp4'};
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const outgoing=screen.getByLabelText('Vídeo em exibição'); fireEvent.playing(outgoing);
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 const incoming=screen.getByLabelText('Vídeo em exibição');
 view.rerender(<CinematicStage video={second} paused muted {...events} />);
 fireEvent.playing(incoming);
 expect(events.onReady).toHaveBeenCalledTimes(1);
 expect(outgoing.parentElement).toHaveAttribute('data-tv-phase','front');
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.error(incoming);
 expect(events.onError).toHaveBeenCalledTimes(1);
 view.rerender(<CinematicStage video={third} paused={false} muted {...events} />);
 expect(outgoing.parentElement).toHaveAttribute('data-tv-phase','front');
 expect(incoming).not.toBeInTheDocument();
 fireEvent.playing(incoming); // An event queued by the discarded element cannot promote it.
 expect(events.onReady).toHaveBeenCalledTimes(1);
});
it('uses the official YouTube API, mutes before playing, advances on ended and destroys the player', async () => {
 let options: ConstructorParameters<YouTubeAPI['Player']>[1];
 const player = {playVideo:vi.fn(),pauseVideo:vi.fn(),mute:vi.fn(),unMute:vi.fn(),destroy:vi.fn(),seekTo:vi.fn(),getCurrentTime:vi.fn(() => 2)};
 window.YT = {Player: vi.fn(function(_element, opts) { options=opts; return player; }) as unknown as YouTubeAPI['Player']};
 const events=callbacks();
 const yt={...first,source_type:'youtube' as const,youtube_id:'M7lc1UVf-VE',url:'https://www.youtube.com/watch?v=M7lc1UVf-VE'};
 let view: ReturnType<typeof render>;
 await act(async () => { view=render(<CinematicStage video={yt} paused={false} muted {...events} />); });
 act(() => options.events.onReady());
 expect(options.playerVars.origin).toBe(window.location.origin);
 expect(options.playerVars.controls).toBe(0);
 expect(options.playerVars.disablekb).toBe(1);
 expect(player.mute.mock.invocationCallOrder[0]).toBeLessThan(player.playVideo.mock.invocationCallOrder[0]);
 act(() => options.events.onStateChange({data:1})); expect(events.onReady).toHaveBeenCalled();
 act(() => options.events.onStateChange({data:2})); expect(events.onPaused).not.toHaveBeenCalled();
 act(() => options.events.onStateChange({data:0})); expect(events.onEnded).toHaveBeenCalled();
 act(() => options.events.onError()); expect(events.onError).toHaveBeenCalled();
 view!.rerender(<CinematicStage video={yt} paused muted {...events} />); expect(player.pauseVideo).toHaveBeenCalled();
 view!.unmount(); expect(player.destroy).toHaveBeenCalledTimes(1);
});

it('retries blocked muted YouTube autoplay once before requesting a user gesture', async () => {
 vi.useFakeTimers();
 let options!: ConstructorParameters<YouTubeAPI['Player']>[1];
 const player={playVideo:vi.fn(),pauseVideo:vi.fn(),mute:vi.fn(),unMute:vi.fn(),destroy:vi.fn(),seekTo:vi.fn(),getCurrentTime:vi.fn(() => 0)};
 window.YT={Player:vi.fn(function(_element, opts) { options=opts; return player; }) as unknown as YouTubeAPI['Player']};
 const events=callbacks();
 await act(async () => { render(<CinematicStage video={{...first,source_type:'youtube',youtube_id:'M7lc1UVf-VE'}} paused={false} muted {...events} />); });
 act(() => options.events.onReady());
 const before=player.playVideo.mock.calls.length;
 act(() => options.events.onAutoplayBlocked());
 expect(events.onBlocked).not.toHaveBeenCalled();
 act(() => vi.advanceTimersByTime(500));
 expect(player.playVideo).toHaveBeenCalledTimes(before+1);
 const muteOrder=player.mute.mock.invocationCallOrder;
 const playOrder=player.playVideo.mock.invocationCallOrder;
 expect(muteOrder[muteOrder.length-1]).toBeLessThan(playOrder[playOrder.length-1]);
 act(() => options.events.onAutoplayBlocked());
 expect(events.onBlocked).toHaveBeenCalledTimes(1);
});

it('recovers unsolicited YouTube pause without overriding an operator pause', async () => {
 vi.useFakeTimers();
 let options!: ConstructorParameters<YouTubeAPI['Player']>[1];
 const player={playVideo:vi.fn(),pauseVideo:vi.fn(),mute:vi.fn(),unMute:vi.fn(),destroy:vi.fn(),seekTo:vi.fn(),getCurrentTime:vi.fn(() => 0)};
 window.YT={Player:vi.fn(function(_element, opts) { options=opts; return player; }) as unknown as YouTubeAPI['Player']};
 const events=callbacks();
 const video={...first,source_type:'youtube' as const,youtube_id:'M7lc1UVf-VE'};
 let view!: ReturnType<typeof render>;
 await act(async () => { view=render(<CinematicStage video={video} paused={false} muted {...events} />); });
 act(() => { options.events.onReady(); options.events.onStateChange({data:1}); });
 const before=player.playVideo.mock.calls.length;
 act(() => { options.events.onStateChange({data:2}); vi.advanceTimersByTime(500); });
 expect(player.playVideo).toHaveBeenCalledTimes(before+1);
 expect(events.onPaused).not.toHaveBeenCalled();
 act(() => options.events.onStateChange({data:2}));
 view.rerender(<CinematicStage video={video} paused muted {...events} />);
 act(() => vi.advanceTimersByTime(500));
 expect(player.playVideo).toHaveBeenCalledTimes(before+1);
});

it('restarts a retained file when cycling back after skipping, and updates its fit', () => {
 vi.useFakeTimers();
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const a=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement; fireEvent.playing(a); a.currentTime=4;
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 view.rerender(<CinematicStage video={first} paused={false} muted {...events} />);
 act(()=>vi.advanceTimersByTime(1300));
 expect(screen.getByLabelText('Vídeo em exibição')).toBe(a); expect(a.currentTime).toBe(0);
 view.rerender(<CinematicStage video={{...first, fit:'cover'}} paused={false} muted {...events} />);
 expect(a.style.objectFit).toBe('cover');
});

it('seeks a retained YouTube source while the next file is still loading without playing while paused', async () => {
 const players: Array<{seekTo: ReturnType<typeof vi.fn>;playVideo:ReturnType<typeof vi.fn>;pauseVideo:ReturnType<typeof vi.fn>}> = [];
 const options: Array<ConstructorParameters<YouTubeAPI['Player']>[1]> = [];
 window.YT={Player:vi.fn(function(_el, opts) {
   options.push(opts); const p={seekTo:vi.fn(),playVideo:vi.fn(),pauseVideo:vi.fn(),mute:vi.fn(),unMute:vi.fn(),destroy:vi.fn(),getCurrentTime:vi.fn(() => 0)}; players.push(p); return p;
 }) as unknown as YouTubeAPI['Player']};
 const a={...first,source_type:'youtube' as const,youtube_id:'M7lc1UVf-VE'};
 const events=callbacks(); let view:ReturnType<typeof render>;
 await act(async () => {view=render(<CinematicStage video={a} muted paused={false} {...events} />);});
 act(() => {options[0].events.onReady(); options[0].events.onStateChange({data:1});});
 await act(async () => {view!.rerender(<CinematicStage video={second} muted paused={false} {...events} />);});
 const count=players[0].playVideo.mock.calls.length;
 view!.rerender(<CinematicStage video={a} muted paused {...events} />);
 expect(players[0].seekTo).toHaveBeenCalledWith(0,true);
 expect(players[0].playVideo).toHaveBeenCalledTimes(count);
 expect(players[0].pauseVideo).toHaveBeenCalled();
});

it('bypasses animated handoffs and decorative light when reduced motion is requested', () => {
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 vi.spyOn(window,'matchMedia').mockReturnValue({...preference,matches:true});
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const outgoing=screen.getByLabelText('Vídeo em exibição'); fireEvent.playing(outgoing);
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 expect(outgoing).not.toBeInTheDocument();
 expect(view.container.querySelector('.tv-cinema-light')).not.toBeInTheDocument();
 expect(view.container.querySelector('[data-tv-transition]')).toHaveAttribute('data-tv-transition','steady');
});

it('waits for actual YouTube playback before dissolving and releases its iframe after the following handoff', async () => {
 vi.useFakeTimers();
 let options!: ConstructorParameters<YouTubeAPI['Player']>[1];
 const player={playVideo:vi.fn(),pauseVideo:vi.fn(),mute:vi.fn(),unMute:vi.fn(),destroy:vi.fn(),seekTo:vi.fn(),getCurrentTime:vi.fn(()=>0)};
 window.YT={Player:vi.fn(function(_element,opts){options=opts;return player;}) as unknown as YouTubeAPI['Player']};
 const events=callbacks();
 const yt={...first,id:'youtube',source_type:'youtube' as const,youtube_id:'M7lc1UVf-VE'};
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const outgoing=screen.getByLabelText('Vídeo em exibição');fireEvent.playing(outgoing);
 await act(async()=>view.rerender(<CinematicStage video={yt} paused={false} muted {...events} />));
 act(()=>options.events.onReady());
 expect(outgoing.parentElement).toHaveAttribute('data-tv-phase','front');
 act(()=>options.events.onStateChange({data:1}));
 expect(outgoing.parentElement).toHaveAttribute('data-tv-phase','outgoing');
 act(()=>vi.advanceTimersByTime(1300));
 expect(outgoing).not.toBeInTheDocument();
 expect(player.destroy).not.toHaveBeenCalled();
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 expect(view.container.querySelector('[data-tv-deck="youtube"]')).toHaveAttribute('data-tv-phase','front');
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 act(()=>vi.advanceTimersByTime(1300));
 expect(player.destroy).toHaveBeenCalledOnce();
 expect(view.container.querySelectorAll('[data-tv-deck]')).toHaveLength(1);
});

it('advances when the browser reaches the end without emitting ended', () => {
 vi.useFakeTimers(); const events=callbacks();
 render(<CinematicStage video={first} paused={false} muted {...events} />);
 const v=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
 Object.defineProperty(v,'duration',{configurable:true,value:5}); v.currentTime=5;
 act(() => {vi.advanceTimersByTime(1000);});
 expect(events.onEnded).toHaveBeenCalledTimes(1);
 fireEvent.ended(v); expect(events.onEnded).toHaveBeenCalledTimes(1);
});
it('does not report progress for repeated timeupdate events at a stuck position', () => {
 const events=callbacks(); render(<CinematicStage video={first} paused={false} muted {...events} />);
 const v=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
 v.currentTime=2; fireEvent.timeUpdate(v); fireEvent.timeUpdate(v); fireEvent.timeUpdate(v);
 expect(events.onProgress).toHaveBeenCalledTimes(1);
});
it('enforces a 15-second slot without waiting for the full file and respects pause', () => {
 vi.useFakeTimers(); const events=callbacks();
 const video={...first,max_duration_seconds:15};
 const view=render(<CinematicStage video={video} paused muted {...events} />);
 const v=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
 Object.defineProperty(v,'duration',{configurable:true,value:60}); v.currentTime=15;
 act(() => {vi.advanceTimersByTime(1000);}); expect(events.onEnded).not.toHaveBeenCalled();
 view.rerender(<CinematicStage video={video} paused={false} muted {...events} />);
 act(() => {vi.advanceTimersByTime(500);}); expect(events.onEnded).toHaveBeenCalledTimes(1);
});
it('tries the compatible source once on decode error before skipping', () => {
 const events=callbacks(); render(<CinematicStage video={{...first,fallback_url:'https://example.com/hd.mp4'}} paused={false} muted {...events} />);
 const v=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement;
 fireEvent.error(v); expect(v.src).toBe('https://example.com/hd.mp4'); expect(events.onError).not.toHaveBeenCalled();
 fireEvent.error(v); expect(events.onError).toHaveBeenCalledTimes(1);
});

const third: TVVideo = { ...first, id:'three', url:'https://example.com/3.mp4' };
const decks = (container: HTMLElement) => container.querySelectorAll('[data-tv-deck]');
it('prepares the next native source paused, muted and hidden before the current one ends', () => {
 const events=callbacks();
 const view=render(<CinematicStage video={first} upcoming={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 const prepared=view.container.querySelector('[data-tv-deck="two"]') as HTMLElement;
 expect(prepared).toHaveAttribute('data-tv-phase','preparing');
 expect(prepared).toHaveAttribute('data-visible','false');
 const media=prepared.querySelector('video') as HTMLVideoElement;
 expect(media.muted).toBe(true); expect(media.autoplay).toBe(false); expect(media).toHaveAttribute('preload','auto');
 expect(vi.mocked(HTMLMediaElement.prototype.play).mock.contexts).not.toContain(media);
 fireEvent.playing(media); // Early playing event from a prepared deck cannot reveal it.
 expect(prepared).toHaveAttribute('data-visible','false');
 expect(events.onReady).toHaveBeenCalledTimes(1);
 fireEvent.loadedData(media);
 expect(media).toHaveAttribute('data-tv-prepared','true');
 // Handoff reuses the already-loaded element instead of creating a new decoder.
 view.rerender(<CinematicStage video={second} upcoming={third} paused={false} muted {...events} />);
 expect(screen.getByLabelText('Vídeo em exibição')).toBe(media);
 expect(decks(view.container)).toHaveLength(2);
 expect(view.container.querySelector('[data-tv-deck="three"]')).not.toBeInTheDocument();
});
it('never mounts a third decoder when the upcoming item changes during a handoff, and replans afterwards', () => {
 vi.useFakeTimers();
 const events=callbacks();
 const fourth={...first,id:'four',url:'https://example.com/4.mp4'};
 const view=render(<CinematicStage video={first} upcoming={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 view.rerender(<CinematicStage video={second} upcoming={third} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 for (const next of [third, fourth, first]) {
  view.rerender(<CinematicStage video={second} upcoming={next} paused={false} muted {...events} />);
  expect(decks(view.container).length).toBeLessThanOrEqual(2);
 }
 view.rerender(<CinematicStage video={fourth} upcoming={third} paused={false} muted {...events} />); // rapid skip
 expect(decks(view.container)).toHaveLength(2);
 act(()=>vi.advanceTimersByTime(1300));
 expect(decks(view.container).length).toBeLessThanOrEqual(2);
 // Live reorder replans the prepared slot in place.
 view.rerender(<CinematicStage video={fourth} upcoming={first} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 act(()=>vi.advanceTimersByTime(1300));
 view.rerender(<CinematicStage video={fourth} upcoming={third} paused={false} muted {...events} />);
 expect(decks(view.container)).toHaveLength(2);
 expect(view.container.querySelector('[data-tv-deck="three"]')).toBeInTheDocument();
 expect(view.container.querySelector('[data-tv-deck="one"]')).not.toBeInTheDocument();
});
it('does not prewarm YouTube items', () => {
 const events=callbacks();
 const yt={...first,id:'yt',source_type:'youtube' as const,youtube_id:'M7lc1UVf-VE'};
 const view=render(<CinematicStage video={first} upcoming={yt} paused={false} muted {...events} />);
 expect(decks(view.container)).toHaveLength(1);
});
it('waits for a presented frame when requestVideoFrameCallback exists and ignores a stale callback', () => {
 vi.useFakeTimers();
 const pending: Array<() => void> = [];
 Object.defineProperty(HTMLVideoElement.prototype,'requestVideoFrameCallback',{configurable:true,value:(cb:()=>void)=>{pending.push(cb);return pending.length;}});
 try {
  const events=callbacks();
  const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
  fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
  expect(events.onReady).not.toHaveBeenCalled();
  pending.shift()!();
  expect(events.onReady).toHaveBeenCalledTimes(1);
  view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
  fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
  view.rerender(<CinematicStage video={third} paused={false} muted {...events} />); // superseded before its frame
  pending.shift()!();
  act(()=>vi.advanceTimersByTime(300));
  expect(events.onReady).toHaveBeenCalledTimes(1);
 } finally { delete (HTMLVideoElement.prototype as { requestVideoFrameCallback?: unknown }).requestVideoFrameCallback; }
});
it.each([
 ['light', {}, 'light', 950, true, false],
 ['depth', {}, 'depth', 900, false, true],
 ['depth', {protect_qr:true}, 'depth', 900, false, false],
 ['light', {protect_text:true}, 'light', 950, false, false],
 ['clean', {}, 'clean', 700, false, false],
] as const)('applies %s profile %o with its timing and protection rules', (profile, extra, attr, ms, light, scale) => {
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 view.rerender(<CinematicStage video={{...second,transition_profile:profile,palette:'ruby',...extra}} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 const stage=view.container.querySelector('.tv-cinema-stage') as HTMLElement;
 expect(stage).toHaveAttribute('data-tv-transition',attr);
 expect(stage.style.getPropertyValue('--tv-dissolve-duration')).toBe(`${ms}ms`);
 expect(!!view.container.querySelector('.tv-cinema-light')).toBe(light);
 expect(!!view.container.querySelector('.tv-cinema-scale')).toBe(scale);
});
