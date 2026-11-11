/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterEach, expect, it, vi } from 'vitest';
import { watchTVWorkerUpdates } from './tvWorkerUpdate';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); window.history.replaceState(null,'','/'); });

it('checks updates for the exact TV route and stops polling/listeners on unmount', async () => {
  vi.useFakeTimers();
  window.history.replaceState(null,'','/video?iniciar=pistache');
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
  const update=vi.fn().mockResolvedValue(undefined);
  const getRegistration=vi.fn().mockResolvedValue({update});
  vi.stubGlobal('navigator',{serviceWorker:{getRegistration}});
  const stop=watchTVWorkerUpdates();
  await vi.advanceTimersByTimeAsync(0);
  expect(update).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(update).toHaveBeenCalledTimes(2);
  window.dispatchEvent(new Event('online'));
  await vi.advanceTimersByTimeAsync(0);
  expect(update).toHaveBeenCalledTimes(3);
  stop();
  await vi.advanceTimersByTimeAsync(120_000);
  window.dispatchEvent(new Event('online'));
  await vi.advanceTimersByTimeAsync(0);
  expect(update).toHaveBeenCalledTimes(3);
  window.history.replaceState(null,'','/video/enviar');
  watchTVWorkerUpdates()();
  expect(getRegistration).toHaveBeenCalledTimes(3);
});

it('does not update a pending registration after leaving the TV', async () => {
  vi.useFakeTimers();
  window.history.replaceState(null,'','/video');
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
  const update=vi.fn().mockResolvedValue(undefined);
  let resolveRegistration!:(value:{update:typeof update})=>void;
  const registration=new Promise<{update:typeof update}>(resolve=>{resolveRegistration=resolve;});
  vi.stubGlobal('navigator',{serviceWorker:{getRegistration:vi.fn(()=>registration)}});
  const stop=watchTVWorkerUpdates();
  stop();
  resolveRegistration({update});
  await vi.advanceTimersByTimeAsync(0);
  expect(update).not.toHaveBeenCalled();
});

it('refreshes only exact TV routes on worker activation and preserves their full URLs', async () => {
  const urls=[
    'https://cafelaregence.com.br/video?iniciar=pistache#tv',
    'https://cafelaregence.com.br/video',
    'https://cafelaregence.com.br/video/enviar',
    'https://cafelaregence.com.br/checkout',
    'https://cafelaregence.com.br/videos',
    'https://another.example/video',
  ];
  const clients=urls.map(url=>({url,navigate:vi.fn().mockResolvedValue(undefined)}));
  const listeners=new Map<string,(event:{waitUntil(promise:Promise<unknown>):void})=>void>();
  runInNewContext(readFileSync(resolve(process.cwd(),'public/sw.js'),'utf8'),{
    self:{location:{origin:'https://cafelaregence.com.br'},addEventListener:(name:string,listener:(event:{waitUntil(promise:Promise<unknown>):void})=>void)=>listeners.set(name,listener),clients:{claim:vi.fn().mockResolvedValue(undefined),matchAll:vi.fn().mockResolvedValue(clients)}},
    caches:{keys:vi.fn().mockResolvedValue(['lr-static-v1']),delete:vi.fn().mockResolvedValue(true)},URL,Promise,
  });
  let activation!:Promise<unknown>;
  listeners.get('activate')!({waitUntil:promise=>{activation=promise;}});
  await activation;
  expect(clients[0].navigate).toHaveBeenCalledExactlyOnceWith(urls[0]);
  expect(clients[1].navigate).toHaveBeenCalledExactlyOnceWith(urls[1]);
  for(const client of clients.slice(2)) expect(client.navigate).not.toHaveBeenCalled();
});
