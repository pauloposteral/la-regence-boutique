import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TVVideo } from "@/lib/tvPlaylist";
import VideoPage from "./VideoPage";

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  from: vi.fn(),
  channel: vi.fn(),
  on: vi.fn(),
  subscribe: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from, channel: mocks.channel, removeChannel: mocks.removeChannel },
}));

const video = (id: string, sort_order: number): TVVideo => ({
  id, title: id, url: `https://example.com/${id}.mp4`, storage_path: `${id}.mp4`,
  sort_order, active: true, archived_at: null, fit: "contain", source_type: "file",
});
const original = [video("cafe", 0), video("produto", 1)];
const queryKey = ["tv-videos", "public"];
let client: QueryClient;

function showPage() {
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/video"]}>
          <VideoPage />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

async function advance(milliseconds = 1) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

function notifyChange() {
  expect(mocks.on).toHaveBeenCalledWith(
    "postgres_changes", { event: "*", schema: "public", table: "tv_videos" }, expect.any(Function),
  );
  act(() => mocks.on.mock.calls[0][2]({ eventType: "INSERT", new: {}, old: {} }));
}

const currentMedia = () => screen.getByLabelText("Vídeo em exibição") as HTMLVideoElement;

function reportTime(media: HTMLVideoElement, seconds: number) {
  Object.defineProperty(media, "duration", { configurable: true, value: 60 });
  media.currentTime = seconds;
  fireEvent.timeUpdate(media);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
  vi.resetAllMocks();
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
  client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 120_000, refetchOnWindowFocus: false, retry: false, gcTime: Infinity },
    },
  });
  mocks.read.mockResolvedValue({ data: original, error: null });
  mocks.from.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => (
      mocks.read().then(resolve, reject)
    ),
  }));
  const channel = { on: mocks.on, subscribe: mocks.subscribe };
  mocks.channel.mockReturnValue(channel);
  mocks.on.mockReturnValue(channel);
  mocks.subscribe.mockReturnValue(channel);
  mocks.removeChannel.mockResolvedValue("ok");
  // JSDOM does not decode media. Keep the real elements, properties, React
  // components and event handlers; stub only unavailable native operations.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  client.clear();
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("updates through Realtime while preserving the native element, pause, position and source history", async () => {
  showPage();
  await advance();
  const first = currentMedia();
  expect(first.src).toBe(original[0].url);
  fireEvent.playing(first);
  fireEvent.ended(first);
  const playing = currentMedia();
  expect(playing.src).toBe(original[1].url);
  fireEvent.playing(playing);
  reportTime(playing, 12);
  fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
  const loadCount = vi.mocked(HTMLMediaElement.prototype.load).mock.calls.length;
  const playCount = vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;

  const added = video("novo", 0);
  const updated = [
    added,
    { ...original[1], sort_order: 1, title: "Produto atualizado" },
    // This already-seen source has a different catalog ID and now follows the
    // current item. Losing source history would replay it before the new file.
    { ...original[0], id: "cafe-copy", sort_order: 2 },
  ];
  mocks.read.mockResolvedValue({ data: updated, error: null });
  notifyChange();
  await advance(251);

  expect(mocks.read).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Produto atualizado")).toBeInTheDocument();
  expect(screen.getByText(/2 de 3 · Pausado · 12 \/ 60 s/)).toBeInTheDocument();
  expect(currentMedia()).toBe(playing);
  expect(playing.currentTime).toBe(12);
  expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(loadCount);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(playCount);

  fireEvent.click(screen.getByRole("button", { name: "Reproduzir" }));
  expect(playing.currentTime).toBe(12);
  fireEvent.playing(playing);
  fireEvent.ended(playing);
  expect(currentMedia().src).toBe(added.url);
});

it("keeps the real player and media available while a refresh is pending and after it fails", async () => {
  showPage();
  await advance();
  const playing = currentMedia();
  fireEvent.playing(playing);
  reportTime(playing, 18);
  const loadCount = vi.mocked(HTMLMediaElement.prototype.load).mock.calls.length;
  const playCount = vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;
  let finish!: (value: { data: null; error: Error }) => void;
  mocks.read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));

  notifyChange();
  await advance(251);
  expect(mocks.read).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Atualizar programação" })).toBeDisabled();
  expect(currentMedia()).toBe(playing);
  expect(playing.currentTime).toBe(18);

  const error = new Error("network unavailable");
  await act(async () => { finish({ data: null, error }); });
  await advance();

  expect(client.getQueryState(queryKey)?.status).toBe("error");
  expect(client.getQueryData(queryKey)).toEqual(original);
  expect(screen.getByRole("button", { name: "Atualizar programação" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
  expect(currentMedia()).toBe(playing);
  expect(playing.currentTime).toBe(18);
  expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(loadCount);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(playCount);
  reportTime(playing, 19);
  expect(screen.getByText(/19 \/ 60 s/)).toBeInTheDocument();
});
