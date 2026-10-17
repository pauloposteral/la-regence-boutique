import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TVVideo } from "@/lib/tvPlaylist";
import PlaylistOrderEditor from "./PlaylistOrderEditor";

const { rpc, savedToast } = vi.hoisted(() => ({ rpc: vi.fn(), savedToast: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
vi.mock("sonner", () => ({ toast: { success: savedToast } }));

const video = (id: string, sort_order: number): TVVideo => ({
  id, title: `Vídeo ${id}`, url: `https://example.com/${id}.mp4`,
  storage_path: null, sort_order, active: true, archived_at: null, fit: "contain",
});
const videos = [video("a", 1), video("b", 2), video("c", 3)];
const conflictMessage = "A programação mudou enquanto você organizava.";
const failedResult = () => ({ data: videos, isError: true, error: new Error("offline") });
const successResult = (data: TVVideo[]) => ({ data, isError: false, error: null });

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ error: null });
  savedToast.mockReset();
});
afterEach(cleanup);

it.each(["result", "rejection"] as const)("preserves the draft and conflict when both conflict refresh and explicit reload fail: %s", async failure => {
  rpc.mockResolvedValue({ error: { code: "40001" } });
  const refresh = failure === "result"
    ? vi.fn().mockResolvedValue(failedResult())
    : vi.fn().mockRejectedValue(new Error("offline"));
  const onClose = vi.fn();
  render(<PlaylistOrderEditor videos={videos} refresh={refresh} onClose={onClose} />);

  fireEvent.change(screen.getByLabelText("Posição de Vídeo c"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar ordem" }));
  const reload = await screen.findByRole("button", { name: "Recarregar ordem" });
  await waitFor(() => expect(reload).toBeEnabled());
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Posição de Vídeo c")).toHaveValue("1");

  fireEvent.click(reload);
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
  expect(await screen.findByText(/Não foi possível recarregar a ordem/)).toBeInTheDocument();
  expect(screen.getByText(conflictMessage, { exact: false })).toBeInTheDocument();
  expect(screen.getByLabelText("Posição de Vídeo c")).toHaveValue("1");
  expect(screen.getByRole("button", { name: "Salvar ordem" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Recarregar ordem" })).toBeEnabled();
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(savedToast).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it("adopts only a successful explicit refetch result and uses its complete snapshot for the next save", async () => {
  rpc.mockResolvedValueOnce({ error: { code: "40001" } }).mockResolvedValueOnce({ error: null });
  const fresh = [video("b", 1), video("a", 2), video("c", 3), video("d", 4)];
  let finishReload!: (result: ReturnType<typeof successResult>) => void;
  const reloadRequest = new Promise<ReturnType<typeof successResult>>(resolve => { finishReload = resolve; });
  const refresh = vi.fn()
    .mockResolvedValueOnce(failedResult())
    .mockReturnValueOnce(reloadRequest)
    .mockResolvedValueOnce(successResult(fresh));
  const onClose = vi.fn();
  const view = render(<PlaylistOrderEditor videos={videos} refresh={refresh} onClose={onClose} />);

  fireEvent.change(screen.getByLabelText("Posição de Vídeo c"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar ordem" }));
  const reload = await screen.findByRole("button", { name: "Recarregar ordem" });
  await waitFor(() => expect(reload).toBeEnabled());
  fireEvent.click(reload);
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText("Posição de Vídeo c")).toHaveValue("1");
  expect(screen.getByText(conflictMessage, { exact: false })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Recarregando ordem…" })).toBeDisabled();

  await act(async () => { finishReload(successResult(fresh)); await reloadRequest; });

  // Query notifications may update parent props after the refetch promise resolves.
  expect(screen.getByLabelText("Posição de Vídeo d")).toHaveValue("4");
  expect(screen.getByLabelText("Posição de Vídeo b")).toHaveValue("1");
  expect(screen.getByLabelText("Posição de Vídeo c")).toHaveValue("3");
  expect(screen.queryByText(conflictMessage, { exact: false })).not.toBeInTheDocument();
  expect(screen.getByText("Esta é a ordem salva")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Salvar ordem" })).toBeDisabled();
  expect(onClose).not.toHaveBeenCalled();

  view.rerender(<PlaylistOrderEditor videos={fresh} refresh={refresh} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText("Posição de Vídeo d"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar ordem" }));
  await waitFor(() => expect(rpc).toHaveBeenLastCalledWith("reorder_tv_videos", {
    p_ordered_ids: ["d", "b", "a", "c"], p_expected_ids: ["b", "a", "c", "d"],
  }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it.each(["result", "rejection"] as const)("keeps a confirmed save successful if its follow-up refresh fails: %s", async failure => {
  const refresh = failure === "result"
    ? vi.fn().mockResolvedValue(failedResult())
    : vi.fn().mockRejectedValue(new Error("offline"));
  const onClose = vi.fn();
  render(<PlaylistOrderEditor videos={videos} refresh={refresh} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText("Posição de Vídeo c"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar ordem" }));

  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(rpc).toHaveBeenCalledExactlyOnceWith("reorder_tv_videos", {
    p_ordered_ids: ["c", "a", "b"], p_expected_ids: ["a", "b", "c"],
  });
  expect(savedToast).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Não foi possível salvar a ordem/)).not.toBeInTheDocument();
});
