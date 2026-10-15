import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createVideoPoster, uploadTVPoster } from './tvUpload';

const {remove}=vi.hoisted(()=>({remove:vi.fn().mockResolvedValue({error:null})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getSession:async()=>({data:{session:{access_token:'test-token'}}})},storage:{from:()=>({remove,getPublicUrl:(path:string)=>({data:{publicUrl:`https://example.com/${path}`}})})}}}));
let request: {open:ReturnType<typeof vi.fn>;setRequestHeader:ReturnType<typeof vi.fn>;send:ReturnType<typeof vi.fn>;abort:ReturnType<typeof vi.fn>;timeout:number;status:number;onload?:()=>void;onerror?:()=>void;onabort?:()=>void;ontimeout?:()=>void};
let nativeVideo:HTMLVideoElement;
let capturedCanvas:HTMLCanvasElement;
const drawImage=vi.fn();
beforeEach(()=>{
 remove.mockResolvedValue({error:null});
 const create=document.createElement.bind(document);
 vi.spyOn(document,'createElement').mockImplementation(((tag:string)=>{
  const element=create(tag);
  if(tag==='video') nativeVideo=element as HTMLVideoElement;
  if(tag==='canvas') capturedCanvas=element as HTMLCanvasElement;
  return element;
 }) as typeof document.createElement);
 vi.stubGlobal('URL',URL);
 URL.createObjectURL=vi.fn(()=> 'blob:poster');
 URL.revokeObjectURL=vi.fn();
 vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn(),drawImage} as unknown as CanvasRenderingContext2D);
 vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(callback=>callback(new Blob(['jpeg'],{type:'image/jpeg'})));
 request={open:vi.fn(),setRequestHeader:vi.fn(),send:vi.fn(),abort:vi.fn(()=>request.onabort?.()),timeout:0,status:201};
 vi.stubGlobal('XMLHttpRequest',vi.fn(function(){return request;}));
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.clearAllMocks();vi.useRealTimers();});
const decodeFrame=()=>{
 Object.defineProperties(nativeVideo,{videoWidth:{value:1920,configurable:true},videoHeight:{value:1080,configurable:true},duration:{value:10,configurable:true}});
 fireEvent.loadedMetadata(nativeVideo);
 expect(nativeVideo.currentTime).toBe(1);
 fireEvent.seeked(nativeVideo);
};
it('captures a 320 by 180 JPEG from the local file and releases its media URL',async()=>{
 const result=createVideoPoster(new File(['movie'],'coffee.mp4'),new AbortController().signal);
 decodeFrame();
 expect((await result).type).toBe('image/jpeg');
 expect([capturedCanvas.width,capturedCanvas.height]).toEqual([320,180]);
 expect(drawImage).toHaveBeenCalledWith(nativeVideo,0,0,320,180);
 expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:poster');
 expect(nativeVideo.getAttribute('src')).toBeNull();
});
it('cancels capture and releases the local resource',async()=>{
 const controller=new AbortController();
 const result=createVideoPoster(new File(['movie'],'coffee.mp4'),controller.signal);
 const failure=expect(result).rejects.toMatchObject({name:'AbortError'});
 controller.abort();await failure;
 expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:poster');
});
it('bounds poster generation instead of keeping an upload pending indefinitely',async()=>{
 vi.useFakeTimers();
 const result=createVideoPoster(new File(['movie'],'coffee.mp4'),new AbortController().signal);
 const failure=expect(result).rejects.toThrow('gerar a capa');
 vi.advanceTimersByTime(10_000);await failure;
 expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:poster');
});
it('stores the JPEG alongside the video and returns a durable image URL',async()=>{
 const result=uploadTVPoster(new File(['movie'],'coffee.mp4'),'owner/clip.mp4',new AbortController().signal);
 decodeFrame();
 await vi.waitFor(()=>expect(request.send).toHaveBeenCalled());
 expect(request.setRequestHeader).toHaveBeenCalledWith('Content-Type','image/jpeg');
 expect(request.timeout).toBe(15000);
 request.onload?.();
 expect(await result).toEqual({path:'owner/clip.jpg',url:'https://example.com/owner/clip.jpg'});
});
it('cancels a poster upload even when storage has not responded',async()=>{
 const controller=new AbortController();
 const result=uploadTVPoster(new File(['movie'],'coffee.mp4'),'owner/clip.mp4',controller.signal);
 const failure=expect(result).rejects.toMatchObject({name:'AbortError'});
 decodeFrame();
 await vi.waitFor(()=>expect(request.send).toHaveBeenCalled());
 controller.abort();await failure;
 expect(request.abort).toHaveBeenCalled();
 expect(remove).toHaveBeenCalledWith(['owner/clip.jpg']);
});
it('bounds a stalled poster request and cleans its path without awaiting cleanup',async()=>{
 remove.mockImplementation(()=>new Promise(()=>{}));
 const result=uploadTVPoster(new File(['movie'],'coffee.mp4'),'owner/clip.mp4',new AbortController().signal);
 const failure=expect(result).rejects.toThrow('demorou demais');
 decodeFrame();
 await vi.waitFor(()=>expect(request.send).toHaveBeenCalled());
 request.ontimeout?.();await failure;
 expect(remove).toHaveBeenCalledWith(['owner/clip.jpg']);
});
