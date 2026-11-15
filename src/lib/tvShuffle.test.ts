import { describe, expect, it } from 'vitest';
import { createTVShuffle } from './tvShuffle';
import { videoSourceKey, type TVVideo } from './tvPlaylist';

const list: TVVideo[] = Array.from({ length: 31 }, (_, i) => ({ id: String(i), title: String(i), url: `https://example.com/${i}.mp4`, storage_path: null, sort_order: i, active: true, archived_at: null, fit: 'contain' }));

describe('TV shuffle reservations', () => {
  it('covers every source in each of 100 rounds, varies order and never repeats at a boundary', () => {
    let seed = 1234;
    const picker = createTVShuffle(() => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32));
    const seen = new Set<string>();
    let current: string | null = null;
    const rounds: string[][] = [];
    for (let round = 0; round < 100; round++) {
      const ids: string[] = [];
      for (let n = 0; n < list.length; n++) {
        const id = picker.pick(list, current, new Set(), seen)!;
        expect(id).not.toBe(current);
        const key = videoSourceKey(list.find(v => v.id === id)!);
        if (seen.has(key)) seen.clear();
        expect(seen.has(key)).toBe(false);
        seen.add(key); ids.push(id); current = id;
      }
      expect(new Set(ids).size).toBe(31);
      rounds.push(ids);
    }
    expect(new Set(rounds.map(ids => ids.join(','))).size).toBe(100);
  });
  it('reserves the same upcoming source across progress, polling, aliases and order edits', () => {
    const picker = createTVShuffle(() => 0.6);
    const seen = new Set([videoSourceKey(list[0])]);
    const id = picker.pick(list, '0', new Set(), seen);
    const changed = list.map(v => ({ ...v, title: 'edited', sort_order: 50 - v.sort_order, ...(v.id === id ? { id: 'alias' } : {}) }));
    expect(picker.pick(changed, '0', new Set(), seen)).toBe('alias');
    expect(picker.pick(list, '0', new Set(), seen)).toBe(id);
  });
  it('replans removed or failed reservations and prioritizes newly added unseen sources', () => {
    const picker = createTVShuffle(() => 0);
    const seen = new Set([videoSourceKey(list[0])]);
    expect(picker.pick(list.slice(0, 3), '0', new Set(), seen)).toBe('1');
    expect(picker.pick(list.slice(0, 3), '0', new Set(['1']), seen)).toBe('2');
    seen.add(videoSourceKey(list[1])); seen.add(videoSourceKey(list[2]));
    expect(picker.pick(list.slice(0, 4), '2', new Set(), seen)).toBe('3');
    expect(picker.pick([list[0]], '0', new Set(), seen)).toBe('0');
    expect(picker.pick([list[0]], '0', new Set(['0']), seen)).toBeNull();
    expect(picker.pick([], null)).toBeNull();
  });
});
