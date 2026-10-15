import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import VideoManager from './VideoManager';
import type { TVVideo } from '@/lib/tvPlaylist';
const { insert, update, eq, single, refresh, refetch, playlist, uploadPoster } = vi.hoisted(() => ({
 insert:vi.fn(), update:vi.fn(), eq:vi.fn(), single:vi.fn(),
 refresh:vi.fn().mockResolvedValue(undefined), refetch:vi.fn().mockResolvedValue({error:null}),
 playlist:{videos:[] as TVVideo[]},
 uploadPoster:vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{from:() => ({insert, update})}}));
vi.mock('@/hooks/useTVVideos', () => ({useTVVideos:() => ({data:playlist.videos,isLoading:false,isError:false,refetch})}));
vi.mock('@tanstack/react-query', () => ({useQueryClient:() => ({invalidateQueries:refresh})}));
vi.mock('@/lib/tvUpload', () => ({
 inspectVideo:vi.fn().mockResolvedValue(undefined),
 uploadTVVideo:vi.fn().mockResolvedValue({path:'new.mp4',url:'https://example.com/new.mp4'}),
 uploadTVPoster:uploadPoster,
}));
const video = (id: string, values: Partial<TVVideo> = {}): TVVideo => ({
 id, title:`Vídeo ${id}`, url:`https://example.com/${id}.mp4`, storage_path:`${id}.mp4`,
 sort_order:0, active:true, archived_at:null, fit:'contain', source_type:'file', max_duration_seconds:null, ...values,
});
const showManager = () => render(<MemoryRouter><VideoManager /></MemoryRouter>);
it('shows a lightweight poster and keeps editing fields collapsed until requested', () => {
 playlist.videos=[video('coffee',{poster_url:'https://example.com/coffee.jpg'})];
 showManager();
 const row=within(screen.getByRole('article',{name:'Vídeo coffee'}));
 expect(row.getByRole('img',{name:'Capa: Vídeo coffee'})).toHaveAttribute('src','https://example.com/coffee.jpg');
 expect(row.queryByLabelText('Nome do vídeo')).not.toBeInTheDocument();
 expect(document.querySelector('video')).not.toBeInTheDocument();
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 expect(row.getByLabelText('Nome do vídeo')).toHaveValue('Vídeo coffee');
 fireEvent.change(row.getByLabelText('Nome do vídeo'),{target:{value:'Rascunho'}});
 fireEvent.click(row.getByRole('button',{name:'Cancelar'}));
 expect(row.queryByLabelText('Nome do vídeo')).not.toBeInTheDocument();
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 expect(row.getByLabelText('Nome do vídeo')).toHaveValue('Vídeo coffee');
 expect(update).not.toHaveBeenCalled();
});
it('identifies YouTube with its thumbnail without mounting the iframe', () => {
 playlist.videos=[video('youtube',{source_type:'youtube',youtube_id:'M7lc1UVf-VE'})];
 showManager();
 expect(screen.getByRole('img',{name:'Capa: Vídeo youtube'})).toHaveAttribute('src','https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg');
 expect(document.querySelector('iframe')).not.toBeInTheDocument();
});
it('shows an honest placeholder when a poster fails', () => {
 playlist.videos=[video('coffee',{poster_url:'https://example.com/coffee.jpg'})];
 showManager();
 fireEvent.error(screen.getByRole('img',{name:'Capa: Vídeo coffee'}));
 expect(screen.getByText('Sem capa')).toBeInTheDocument();
 expect(document.querySelector('video')).not.toBeInTheDocument();
});
it('returns keyboard focus to Edit after a pending save completes', async () => {
 let finish!: (value:{error:null})=>void;
 single.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 playlist.videos=[video('coffee')];showManager();
 const row=within(screen.getByRole('article',{name:'Vídeo coffee'}));
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 const save=row.getByRole('button',{name:'Salvar'});save.focus();fireEvent.click(save);
 await waitFor(()=>expect(single).toHaveBeenCalled());
 finish({error:null});
 await waitFor(()=>expect(row.getByRole('button',{name:'Editar'})).toHaveFocus());
});
it.each([
 {archived:true, expected:11},
 {archived:false, expected:999999},
])('uploads with a valid order when a maximum-order video is archived=$archived', async ({archived,expected}) => {
 playlist.videos=[video('current',{sort_order:10}),video('maximum',{sort_order:999999,archived_at:archived?'2026-01-01':null})];
 insert.mockResolvedValue({error:null});
 showManager();
 fireEvent.change(document.getElementById('tv-video-file')!,{target:{files:[new File(['video'],'cafe.mp4',{type:'video/mp4'})]}});
 fireEvent.click(screen.getByRole('button',{name:'Enviar vídeo'}));
 await waitFor(() => expect(insert).toHaveBeenCalledWith(expect.objectContaining({storage_path:'new.mp4',sort_order:expected})));
 await waitFor(() => expect(refresh).toHaveBeenCalled());
});
it('ignores archived orders when adding a YouTube video', async () => {
 playlist.videos=[video('current',{sort_order:10}),video('old',{sort_order:999999,archived_at:'2026-01-01'})];
 insert.mockResolvedValue({error:null});
 showManager();
 const form=within(screen.getByRole('form',{name:'Adicionar YouTube'}));
 fireEvent.change(form.getByLabelText('Link do YouTube'),{target:{value:'https://youtu.be/M7lc1UVf-VE'}});
 fireEvent.change(form.getByLabelText('Nome para a programação'),{target:{value:'Café'}});
 fireEvent.click(form.getByRole('button',{name:'Adicionar à programação'}));
 await waitFor(() => expect(insert).toHaveBeenCalledWith(expect.objectContaining({source_type:'youtube',sort_order:11})));
 await waitFor(() => expect(refresh).toHaveBeenCalled());
});
beforeEach(() => {
 playlist.videos = [];
 update.mockReturnValue({eq});
 eq.mockReturnValue({select:() => ({single})});
 single.mockResolvedValue({error:null});
 uploadPoster.mockResolvedValue({path:'new.jpg',url:'https://example.com/new.jpg'});
});
afterEach(() => {cleanup();vi.clearAllMocks();});
it('saves the generated poster with a new uploaded video', async () => {
 insert.mockResolvedValue({error:null});
 showManager();
 const file=new File(['video'],'cafe.mp4',{type:'video/mp4'});
 fireEvent.change(document.getElementById('tv-video-file')!,{target:{files:[file]}});
 fireEvent.click(screen.getByRole('button',{name:'Enviar vídeo'}));
 await waitFor(()=>expect(insert).toHaveBeenCalledWith(expect.objectContaining({poster_url:'https://example.com/new.jpg'})));
 expect(uploadPoster).toHaveBeenCalledWith(file,'new.mp4',expect.any(AbortSignal));
});
it('still saves the video when optional poster generation fails', async () => {
 uploadPoster.mockRejectedValue(new Error('canvas unavailable'));
 insert.mockResolvedValue({error:null});
 showManager();
 fireEvent.change(document.getElementById('tv-video-file')!,{target:{files:[new File(['video'],'cafe.mp4',{type:'video/mp4'})]}});
 fireEvent.click(screen.getByRole('button',{name:'Enviar vídeo'}));
 await waitFor(()=>expect(insert).toHaveBeenCalledWith(expect.objectContaining({url:'https://example.com/new.mp4',poster_url:null})));
 await waitFor(()=>expect(refresh).toHaveBeenCalled());
});
it('validates YouTube links then saves a canonical source into the shared programming', async () => {
 insert.mockResolvedValue({error:null});
 render(<MemoryRouter><VideoManager /></MemoryRouter>);
 const form=within(screen.getByRole('form',{name:'Adicionar YouTube'}));
 fireEvent.change(form.getByLabelText('Link do YouTube'),{target:{value:'https://youtube.com.evil.test/watch?v=M7lc1UVf-VE'}});
 fireEvent.click(form.getByRole('button',{name:'Adicionar à programação'}));
 expect(form.getByRole('alert')).toHaveTextContent('link válido'); expect(insert).not.toHaveBeenCalled();
 fireEvent.change(form.getByLabelText('Link do YouTube'),{target:{value:'https://youtu.be/M7lc1UVf-VE?si=abc'}});
 fireEvent.change(form.getByLabelText('Nome para a programação'),{target:{value:' Nosso café '}});
 fireEvent.click(form.getByRole('button',{name:'Adicionar à programação'}));
 await waitFor(() => expect(refresh).toHaveBeenCalled());
 expect(insert).toHaveBeenCalledWith(expect.objectContaining({title:'Nosso café',url:'https://www.youtube.com/watch?v=M7lc1UVf-VE',youtube_id:'M7lc1UVf-VE',source_type:'youtube',storage_path:null,fit:'contain',active:true}));
 expect(form.getByLabelText('Link do YouTube')).toHaveValue('');
});
it('keeps the input when saving fails so an admin can retry', async () => {
 insert.mockResolvedValue({error:new Error('offline')});
 render(<MemoryRouter><VideoManager /></MemoryRouter>);
 const form=within(screen.getByRole('form',{name:'Adicionar YouTube'}));
 fireEvent.change(form.getByLabelText('Link do YouTube'),{target:{value:'https://youtu.be/M7lc1UVf-VE'}});
 fireEvent.change(form.getByLabelText('Nome para a programação'),{target:{value:'Café'}});
 fireEvent.click(form.getByRole('button',{name:'Adicionar à programação'}));
 await waitFor(() => expect(form.getByRole('alert')).toHaveTextContent('Não foi possível'));
 expect(form.getByLabelText('Link do YouTube')).toHaveValue('https://youtu.be/M7lc1UVf-VE');
});

it('searches by name without accents, filters status, and clears an empty search', () => {
 playlist.videos = [video('active', {title:'Café especial'}), video('paused', {title:'Torra clara', active:false}), video('archived', {title:'Antigo', archived_at:'2026-01-01', active:true})];
 showManager();
 expect(screen.getByText('1 ativos · 2 vídeos · 1 arquivados')).toBeInTheDocument();
 expect(screen.queryByRole('article', {name:'Antigo'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Buscar por nome'), {target:{value:'cafe'}});
 expect(screen.getByRole('article', {name:'Café especial'})).toBeInTheDocument();
 expect(screen.queryByRole('article', {name:'Torra clara'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Buscar por nome'), {target:{value:'inexistente'}});
 expect(screen.getByText('Nenhum vídeo encontrado para esta busca ou filtro.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', {name:'Limpar busca'}));
 fireEvent.change(screen.getByLabelText('Filtrar vídeos'), {target:{value:'paused'}});
 expect(screen.getByRole('article', {name:'Torra clara'})).toBeInTheDocument();
 expect(screen.queryByRole('article', {name:'Café especial'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Filtrar vídeos'), {target:{value:'active'}});
 expect(screen.getByRole('article', {name:'Café especial'})).toBeInTheDocument();
 expect(screen.queryByRole('article', {name:'Torra clara'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Filtrar vídeos'), {target:{value:'archived'}});
 expect(screen.getByRole('article', {name:'Antigo'})).toBeInTheDocument();
 expect(screen.queryByRole('article', {name:'Café especial'})).not.toBeInTheDocument();
});

it('bounds the playlist to 12 items per page and resets the page when filtering', () => {
 playlist.videos = Array.from({length:13}, (_, index) => video(String(index), {active:index === 12}));
 showManager();
 expect(screen.getAllByRole('article')).toHaveLength(12);
 const navigation = within(screen.getByRole('navigation', {name:'Páginas da programação'}));
 expect(navigation.getByRole('button', {name:'Anterior'})).toBeDisabled();
 fireEvent.click(navigation.getByRole('button', {name:'Próxima'}));
 expect(screen.getAllByRole('article')).toHaveLength(1);
 expect(screen.getByRole('article', {name:'Vídeo 12'})).toBeInTheDocument();
 expect(navigation.getByRole('button', {name:'Próxima'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Filtrar vídeos'), {target:{value:'active'}});
 expect(screen.getByRole('status')).toHaveTextContent('Página 1 de 1');
});

it('archives only after confirmation and preserves the file', async () => {
 playlist.videos = [video('coffee', {title:'Café'})];
 showManager();
 const row = within(screen.getByRole('article', {name:'Café'}));
 expect(row.getByRole('link', {name:'Ver na TV'})).toHaveAttribute('href', '/video?iniciar=coffee');
 fireEvent.click(row.getByRole('button', {name:'Arquivar Café'}));
 expect(update).not.toHaveBeenCalled();
 fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', {name:'Arquivar vídeo'}));
 await waitFor(() => expect(refresh).toHaveBeenCalled());
 expect(update).toHaveBeenCalledWith({active:false, archived_at:expect.any(String)});
 expect(eq).toHaveBeenCalledWith('id', 'coffee');
});

it('restores archived videos as paused without offering activation or a TV preview', async () => {
 playlist.videos = [video('old', {title:'Antigo', archived_at:'2026-01-01', active:true})];
 showManager();
 fireEvent.change(screen.getByLabelText('Filtrar vídeos'), {target:{value:'archived'}});
 const row = within(screen.getByRole('article', {name:'Antigo'}));
 expect(row.queryByRole('link', {name:'Ver na TV'})).not.toBeInTheDocument();
 expect(row.queryByRole('button', {name:'Ativar na TV'})).not.toBeInTheDocument();
 fireEvent.click(row.getByRole('button', {name:'Restaurar como pausado'}));
 await waitFor(() => expect(refresh).toHaveBeenCalled());
 expect(update).toHaveBeenCalledWith({active:false, archived_at:null});
 expect(eq).toHaveBeenCalledWith('id', 'old');
});

it('saves an optional 15-second limit and clears it back to the whole video', async () => {
 playlist.videos = [video('coffee')];
 showManager();
 const row = within(screen.getByRole('article', {name:'Vídeo coffee'}));
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 const duration = row.getByLabelText('Tempo na TV (segundos, opcional)');
 fireEvent.change(duration, {target:{value:'15'}});
 fireEvent.click(row.getByRole('button', {name:'Salvar'}));
 await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
 expect(update).toHaveBeenLastCalledWith(expect.objectContaining({max_duration_seconds:15}));
 await waitFor(() => expect(row.getByRole('button', {name:'Editar'})).toBeEnabled());
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 fireEvent.change(row.getByLabelText('Tempo na TV (segundos, opcional)'), {target:{value:''}});
 fireEvent.click(row.getByRole('button', {name:'Salvar'}));
 await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
 expect(update).toHaveBeenLastCalledWith(expect.objectContaining({max_duration_seconds:null}));
});

it.each(['0', '3601', '1.5'])('rejects an invalid per-video limit of %s seconds', invalid => {
 playlist.videos = [video('coffee')];
 showManager();
 const row = within(screen.getByRole('article', {name:'Vídeo coffee'}));
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 fireEvent.change(row.getByLabelText('Tempo na TV (segundos, opcional)'), {target:{value:invalid}});
 fireEvent.click(row.getByRole('button', {name:'Salvar'}));
 expect(row.getByRole('alert')).toHaveTextContent('entre 1 e 3600 segundos');
 expect(update).not.toHaveBeenCalled();
});

it('refreshes the list on request and mounts native previews only when opened', async () => {
 playlist.videos = [video('coffee')];
 showManager();
 expect(screen.queryByLabelText('Prévia: Vídeo coffee')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', {name:'Mostrar prévia'}));
 expect(screen.getByLabelText('Prévia: Vídeo coffee')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', {name:'Fechar prévia'}));
 expect(screen.queryByLabelText('Prévia: Vídeo coffee')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', {name:'Atualizar lista'}));
 await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
});


it('shows an HTTPS source link and plain-text credit without altering saved metadata', () => {
 playlist.videos = [video('source', {source_url:'https://www.pexels.com/video/123/', credit:'Autor no Pexels'})];
 showManager();
 const row = within(screen.getByRole('article', {name:'Vídeo source'}));
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 const link = row.getByRole('link', {name:'Ver origem do vídeo'});
 expect(link).toHaveAttribute('href', 'https://www.pexels.com/video/123/');
 expect(link).toHaveAttribute('target', '_blank');
 expect(link).toHaveAttribute('rel', 'noopener noreferrer');
 expect(row.getByText('Crédito: Autor no Pexels')).toBeInTheDocument();
 expect(update).not.toHaveBeenCalled();
 expect(insert).not.toHaveBeenCalled();
});

it.each(['javascript:alert(1)', 'http://example.com/video', 'not a URL', 'https://user:secret@example.com/video'])('hides an unsafe source URL: %s', source_url => {
 playlist.videos = [video('source', {source_url, credit:'Autor'})];
 showManager();
 const row = within(screen.getByRole('article', {name:'Vídeo source'}));
 fireEvent.click(row.getByRole('button',{name:'Editar'}));
 expect(row.queryByRole('link', {name:'Ver origem do vídeo'})).not.toBeInTheDocument();
 expect(row.getByText('Crédito: Autor')).toBeInTheDocument();
});
it('keeps public TV links hidden for paused items', () => {
 playlist.videos=[video('paused',{active:false})];
 showManager();
 expect(screen.queryByRole('link',{name:'Ver na TV'})).not.toBeInTheDocument();
});
