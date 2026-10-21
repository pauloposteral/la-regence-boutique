import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
describe("session hydration", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("does not overwrite newer sign-in with a stale session lookup", async () => {
    let resolve: (value: unknown) => void = () => {};
    let listener: (event: string, session: unknown) => void = () => {};
    auth.getSession.mockReturnValue(new Promise((done) => { resolve = done; }));
    auth.onAuthStateChange.mockImplementation((callback) => { listener = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
    const { result } = renderHook(() => useAuth());
    act(() => listener("SIGNED_IN", { user: { id: "verified-user" } }));
    await act(async () => resolve({ data: { session: null }, error: null }));
    expect(result.current.user?.id).toBe("verified-user");
    expect(result.current.loading).toBe(false);
  });
  it("ends loading and exposes lookup failure", async () => {
    auth.getSession.mockRejectedValue(new Error("Network unavailable"));
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Network unavailable");
    expect(result.current.user).toBeNull();
  });
});