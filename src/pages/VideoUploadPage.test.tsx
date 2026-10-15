import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, describe, expect, it, vi } from "vitest";
import VideoUploadPage from "./VideoUploadPage";

const { auth, rpc } = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
vi.mock("@/hooks/useTVVideos", () => ({ useTVVideos: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) }));

function mount() {
  return render(<HelmetProvider><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={["/video/enviar"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/video/enviar" element={<VideoUploadPage />} /><Route path="/auth" element={<p>Login necessário</p>} /></Routes></MemoryRouter></QueryClientProvider></HelmetProvider>);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("TV management access and file selection", () => {
  it("waits for session recovery before redirecting", () => {
    auth.mockReturnValue({ user: null, loading: true }); mount();
    expect(screen.getByRole("status")).toHaveTextContent("Verificando acesso");
    expect(screen.queryByText("Login necessário")).not.toBeInTheDocument();
  });
  it("requires login for uploads", async () => {
    auth.mockReturnValue({ user: null, loading: false }); mount();
    expect(await screen.findByText("Login necessário")).toBeInTheDocument();
  });
  it("does not expose the uploader to a signed-in customer", async () => {
    auth.mockReturnValue({ user: { id: "customer" }, loading: false });
    rpc.mockResolvedValue({ data: false, error: null }); mount();
    expect(await screen.findByRole("heading", { name: "Acesso administrativo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Escolher vídeo" })).not.toBeInTheDocument();
  });
  it("lets an admin choose files and explains unsupported formats before uploading", async () => {
    auth.mockReturnValue({ user: { id: "admin" }, loading: false });
    rpc.mockResolvedValue({ data: true, error: null }); const { container } = mount();
    expect(await screen.findByRole("button", { name: "Escolher vídeo" })).toBeInTheDocument();
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(["text"], "no.html", { type: "text/html" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent("MP4 ou WebM");
    expect(screen.queryByRole("button", { name: "Enviar vídeo" })).not.toBeInTheDocument();
  });
});
