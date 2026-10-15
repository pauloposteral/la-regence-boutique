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
 expect(options.playerVars.controls).toBe(1);
 expect(player.mute.mock.invocationCallOrder[0]).toBeLessThan(player.playVideo.mock.invocationCallOrder[0]);
 act(() => options.events.onStateChange({data:1})); expect(events.onReady).toHaveBeenCalled();
 act(() => options.events.onStateChange({data:2})); expect(events.onPaused).toHaveBeenCalled();
 act(() => options.events.onStateChange({data:0})); expect(events.onEnded).toHaveBeenCalled();
 act(() => options.events.onError()); expect(events.onError).toHaveBeenCalled();
 act(() => options.events.onAutoplayBlocked()); expect(events.onBlocked).toHaveBeenCalled();
 view!.rerender(<CinematicStage video={yt} paused muted {...events} />); expect(player.pauseVideo).toHaveBeenCalled();
 view!.unmount(); expect(player.destroy).toHaveBeenCalledTimes(1);
});

it('restarts a retained file when cycling back after skipping, and updates its fit', () => {
 const events=callbacks();
 const view=render(<CinematicStage video={first} paused={false} muted {...events} />);
 const a=screen.getByLabelText('Vídeo em exibição') as HTMLVideoElement; fireEvent.playing(a); a.currentTime=4;
 view.rerender(<CinematicStage video={second} paused={false} muted {...events} />);
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 view.rerender(<CinematicStage video={first} paused={false} muted {...events} />);
 expect(screen.getByLabelText('Vídeo em exibição')).toBe(a); expect(a.currentTime).toBe(0);
 view.rerender(<CinematicStage video={{...first, fit:'cover'}} paused={false} muted {...events} />);
 expect(a.style.objectFit).toBe('cover');
});

it('seeks a retained YouTube source to zero without playing while paused', async () => {
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
 fireEvent.playing(screen.getByLabelText('Vídeo em exibição'));
 const count=players[0].playVideo.mock.calls.length;
 view!.rerender(<CinematicStage video={a} muted paused {...events} />);
 expect(players[0].seekTo).toHaveBeenCalledWith(0,true);
 expect(players[0].playVideo).toHaveBeenCalledTimes(count);
 expect(players[0].pauseVideo).toHaveBeenCalled();
});
