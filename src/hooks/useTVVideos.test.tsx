import type { PropsWithChildren } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TVVideo } from "@/lib/tvPlaylist";
import { useTVVideos } from "./useTVVideos";

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from, channel: mocks.channel, removeChannel: mocks.removeChannel },
}));

type TestChannel = {
  name: string;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

const channels: TestChannel[] = [];
const clients: QueryClient[] = [];
const publicKey = ["tv-videos", "public"];

const video = (id: string): TVVideo => ({
  id, title: id, url: `https://example.com/${id}.mp4`, storage_path: `${id}.mp4`,
  sort_order: 0, active: true, archived_at: null, fit: "contain", source_type: "file",
});

function makeClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Match the application's cache and focus settings so short reconnects
        // exercise the TV hook's overrides, rather than test-only defaults.
        staleTime: 120_000,
        refetchOnWindowFocus: false,
        retry: false,
        gcTime: Infinity,
      },
    },
  });
  clients.push(client);
  return client;
}

function showHook(admin = false, enabled = true, client = makeClient()) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    client,
    ...renderHook(({ admin, enabled }) => useTVVideos(admin, enabled), {
      initialProps: { admin, enabled },
      wrapper,
    }),
  };
}

async function advance(milliseconds = 1) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

function change(channel = channels[0]) {
  act(() => channel.on.mock.calls[0][2]({
    eventType: "UPDATE", new: video("payload-only"), old: {},
  }));
}

function status(value: string, channel = channels[0]) {
  act(() => channel.subscribe.mock.calls[0][0](value));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
  vi.resetAllMocks();
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
  channels.length = 0;
  mocks.read.mockResolvedValue({ data: [video("initial")], error: null });
  mocks.from.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => (
      mocks.read().then(resolve, reject)
    ),
  }));
  mocks.channel.mockImplementation((name: string) => {
    const channel = {
      name,
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    };
    channels.push(channel);
    return channel;
  });
  mocks.removeChannel.mockResolvedValue("ok");
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach(client => client.clear());
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
  vi.useRealTimers();
});

describe("useTVVideos synchronization", () => {
  it.each([false, true])("polls in the background without a realtime event (admin=%s)", async admin => {
    focusManager.setFocused(false);
    const { result } = showHook(admin);
    await advance();
    expect(result.current.data).toEqual([video("initial")]);

    mocks.read.mockResolvedValue({ data: [video("uploaded")], error: null });
    await advance(15_000);

    expect(mocks.read).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([video("uploaded")]);
  });

  it("coalesces a stream of events within a fixed window and fetches the saved list", async () => {
    const { result } = showHook();
    await advance();
    expect(channels).toHaveLength(1);
    expect(channels[0].on).toHaveBeenCalledWith(
      "postgres_changes", { event: "*", schema: "public", table: "tv_videos" }, expect.any(Function),
    );
    mocks.read.mockResolvedValue({ data: [video("saved")], error: null });

    change();
    await advance(100);
    change();
    await advance(100);
    change();
    expect(mocks.read).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([video("initial")]);
    await advance(51);

    expect(mocks.read).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([video("saved")]);
  });

  it("refreshes on initial subscription and on a later realtime reconnection", async () => {
    const { result } = showHook();
    await advance();
    expect(channels).toHaveLength(1);
    mocks.read.mockResolvedValue({ data: [video("after-subscribe")], error: null });
    status("SUBSCRIBED");
    await advance();
    expect(result.current.data).toEqual([video("after-subscribe")]);

    status("CHANNEL_ERROR");
    mocks.read.mockResolvedValue({ data: [video("after-reconnect")], error: null });
    status("SUBSCRIBED");
    await advance();

    expect(mocks.read).toHaveBeenCalledTimes(3);
    expect(result.current.data).toEqual([video("after-reconnect")]);
  });

  it("invalidates only its exact query, keeping the other audience and nested keys separate", async () => {
    const client = makeClient();
    const publicHook = showHook(false, true, client);
    const adminHook = showHook(true, true, client);
    client.setQueryData([...publicKey, "preview"], [video("preview")]);
    await advance();
    expect(channels).toHaveLength(2);
    mocks.read.mockResolvedValue({ data: [video("changed")], error: null });

    change(channels[0]);
    await advance(251);

    expect(mocks.read).toHaveBeenCalledTimes(3);
    expect(publicHook.result.current.data).toEqual([video("changed")]);
    expect(adminHook.result.current.data).toEqual([video("initial")]);
    expect(client.getQueryState(["tv-videos", "admin"])?.isInvalidated).toBe(false);
    expect(client.getQueryState([...publicKey, "preview"])?.isInvalidated).toBe(false);
  });

  it("keeps a unique channel per hook instance without resubscribing on rerenders", async () => {
    const client = makeClient();
    const first = showHook(false, true, client);
    showHook(false, true, client);
    await advance();

    expect(channels).toHaveLength(2);
    expect(channels[0].name).not.toBe(channels[1].name);
    first.rerender({ admin: false, enabled: true });
    expect(channels).toHaveLength(2);
    expect(mocks.removeChannel).not.toHaveBeenCalled();
  });

  it("opens no disabled channel and cancels pending refreshes when disabled or unmounted", async () => {
    const { client, rerender, unmount } = showHook(false, false);
    await advance();
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.channel).not.toHaveBeenCalled();

    rerender({ admin: false, enabled: true });
    await advance();
    expect(channels).toHaveLength(1);
    change();
    rerender({ admin: false, enabled: false });
    expect(mocks.removeChannel).toHaveBeenCalledWith(channels[0]);
    await advance(251);
    expect(client.getQueryState(publicKey)?.isInvalidated).toBe(false);
    expect(mocks.read).toHaveBeenCalledTimes(1);

    rerender({ admin: false, enabled: true });
    await advance();
    expect(channels).toHaveLength(2);
    change(channels[1]);
    unmount();
    expect(mocks.removeChannel).toHaveBeenCalledTimes(2);
    expect(mocks.removeChannel).toHaveBeenLastCalledWith(channels[1]);
    // Simulate callbacks already in flight when the old channel was removed.
    change(channels[1]);
    status("SUBSCRIBED", channels[1]);
    await advance(251);
    expect(client.getQueryState(publicKey)?.isInvalidated).toBe(false);
    expect(mocks.read).toHaveBeenCalledTimes(2);
  });

  it("refetches after a short network interruption despite the application's two-minute cache", async () => {
    const { result } = showHook();
    await advance();
    mocks.read.mockResolvedValue({ data: [video("while-offline")], error: null });
    act(() => onlineManager.setOnline(false));
    await advance(50);
    act(() => onlineManager.setOnline(true));
    await advance();

    expect(mocks.read).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([video("while-offline")]);
  });

  it("refetches when the TV becomes visible despite the application's disabled focus refresh", async () => {
    const { result } = showHook();
    await advance();
    mocks.read.mockResolvedValue({ data: [video("while-hidden")], error: null });
    act(() => focusManager.setFocused(false));
    await advance(50);
    act(() => focusManager.setFocused(true));
    await advance();

    expect(mocks.read).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([video("while-hidden")]);
  });

  it("retains the last successful list when a background refresh fails and recovers on the next poll", async () => {
    const { result } = showHook();
    await advance();
    const error = new Error("network unavailable");
    mocks.read.mockResolvedValue({ data: null, error });
    await advance(15_000);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(result.current.data).toEqual([video("initial")]);

    mocks.read.mockResolvedValue({ data: [video("recovered")], error: null });
    await advance(15_000);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual([video("recovered")]);
  });
});
