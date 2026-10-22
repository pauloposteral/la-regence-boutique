import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthPage from "./AuthPage";

const auth = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
vi.mock("@/components/layout/Layout", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/integrations/lovable", () => ({ lovable: { auth: { signInWithOAuth: vi.fn() } } }));

describe("BAM-181 auth → checkout (simulated session, no credentials/network)", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());
  it("waits for confirmed auth then returns to checkout even if the storage getter throws", async () => {
    let listener: (event: string, session: unknown) => void = () => {};
    auth.getSession.mockReturnValue(new Promise(() => {}));
    auth.onAuthStateChange.mockImplementation((callback) => {
      listener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    render(<MemoryRouter initialEntries={["/auth?next=%2Fcheckout"]}><Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/checkout" element={<h1>Mock checkout destination</h1>} />
    </Routes></MemoryRouter>);
    expect(screen.queryByRole("heading", { name: "Mock checkout destination" })).not.toBeInTheDocument();
    await act(async () => listener("SIGNED_IN", { user: { id: "simulated-user" } }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Mock checkout destination" })).toBeInTheDocument());
  });
});