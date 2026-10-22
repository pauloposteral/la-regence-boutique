import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "./CheckoutPage";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), validate: vi.fn(), error: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({
  items: [{ produtoId: "mock-product", nome: "Mock coffee", preco: 79.9, precoPromocional: 69.9, quantidade: 1 }],
  subtotal: 69.9, desconto: 0, cupom: null, cupomTipo: null, clearCart: vi.fn(), validatePricesNow: mocks.validate,
}) }));
vi.mock("@/components/layout/Layout", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/lib/analytics", () => ({ trackBeginCheckout: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, info: vi.fn() } }));

async function reviewPix() {
  render(<MemoryRouter><CheckoutPage /></MemoryRouter>);
  const fill = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
  fill("checkout-nome", "Simulated Customer"); fill("checkout-email", "mock@example.invalid");
  fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
  await waitFor(() => expect(document.getElementById("checkout-cep")).toBeTruthy());
  for (const [id, value] of Object.entries({ cep: "01001000", logradouro: "Mock street", numero: "1", bairro: "Mock", cidade: "Mock", estado: "SP" })) fill(`checkout-${id}`, value);
  fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
  await screen.findByRole("radio", { name: "Mock · Shipping" });
  fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
  fireEvent.click(await screen.findByRole("radio", { name: "Pix" }));
  fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
  fireEvent.click(await screen.findByRole("button", { name: /Confirmar e Pagar/i }));
}

describe("BAM-181 review → mocked gateway (no order/payment/network)", () => {
  beforeEach(() => {
    vi.clearAllMocks(); window.location.hash = "";
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    mocks.validate.mockResolvedValue(false);
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  it.each([[62.91, true], [62.92, false]])("accepts exact cents only: gateway total %s", async (total, accepted) => {
    mocks.invoke.mockImplementation(async (name: string) => name === "calcular-frete"
      ? { data: { options: [{ id: "mock", company: "Mock", name: "Shipping", price: 0, free: true }] }, error: null }
      : { data: { url: "#simulated-gateway", validated: { total } }, error: null });
    await reviewPix();
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("create-checkout-payment", expect.objectContaining({ body: expect.objectContaining({ metodoPagamento: "pix" }) })));
    if (accepted) await waitFor(() => expect(window.location.hash).toBe("#simulated-gateway"));
    else { await waitFor(() => expect(mocks.error).toHaveBeenCalled()); expect(window.location.hash).toBe(""); }
  });
});