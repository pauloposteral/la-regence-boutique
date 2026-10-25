import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "./CheckoutPage";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), validate: vi.fn(), error: vi.fn(),
  cart: { subtotal: 69.9, quantidade: 1, desconto: 0, cupom: null as string | null } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/contexts/CartContext", async () => {
  const { useState } = await import("react");
  return { useCart: () => {
    const [desconto, setDesconto] = useState(mocks.cart.desconto);
    const [cupom, setCupom] = useState(mocks.cart.cupom);
    const [cupomTipo, setCupomTipo] = useState<"desconto" | "frete_gratis" | null>(null);
    return {
      items: [{ produtoId: "mock-product", nome: "Mock coffee", preco: 79.9, precoPromocional: 69.9, quantidade: mocks.cart.quantidade }],
      subtotal: mocks.cart.subtotal, desconto, cupom, cupomTipo, setDesconto, setCupom, setCupomTipo,
      clearCart: vi.fn(), validatePricesNow: mocks.validate,
    };
  } };
});
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
  // Switching to Pix must re-quote shipping (free-shipping base changes); wait for the fresh quote.
  await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("calcular-frete", expect.objectContaining({ body: expect.objectContaining({ metodo_pagamento: "pix" }) })));
  await act(async () => { await Promise.resolve(); });
  fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
  fireEvent.click(await screen.findByRole("button", { name: /Confirmar e Pagar/i }));
}

describe("BAM-181 review → mocked gateway (no order/payment/network)", () => {
  beforeEach(() => {
    vi.clearAllMocks(); window.location.hash = "";
    mocks.cart = { subtotal: 69.9, quantidade: 1, desconto: 0, cupom: null };
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    mocks.validate.mockResolvedValue(false);
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  it("simulated: coupon applied at 100 refreshes to 20 after cart grows to 200, then pays 180 without repeated drift", async () => {
    mocks.cart = { subtotal: 100, quantidade: 1, desconto: 10, cupom: "PRIMEIRACOMPRA10" };
    mocks.invoke.mockImplementation(async (name: string, opts: { body: { subtotal?: number; expectedTotal?: number } }) => {
      if (name === "calcular-frete") return { data: {
        coupon: { valid: true, motivo: "ok", tipo: "desconto", desconto: (opts.body.subtotal ?? 0) / 10 },
        options: [{ id: "mock", company: "Mock", name: "Shipping", price: 0, free: true }],
      }, error: null };
      return opts.body.expectedTotal === 180
        ? { data: { url: "#simulated-gateway", validated: { total: 180 } }, error: null }
        : { data: null, error: { context: { status: 409, json: async () => ({ code: "total_drift", validated: { total: 180 } }) } } };
    });
    const view = render(<MemoryRouter><CheckoutPage /></MemoryRouter>);
    const fill = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
    const next = () => fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
    fill("checkout-nome", "Simulated Customer"); fill("checkout-email", "mock@example.invalid"); next();
    await waitFor(() => expect(document.getElementById("checkout-cep")).toBeTruthy());
    for (const [id, value] of Object.entries({ cep: "01001000", logradouro: "Mock", numero: "1", bairro: "Mock", cidade: "Mock", estado: "SP" })) fill(`checkout-${id}`, value);
    next();
    await screen.findByRole("radio", { name: "Mock · Shipping" });
    await act(async () => { await Promise.resolve(); });
    mocks.cart.subtotal = 200; mocks.cart.quantidade = 2;
    view.rerender(<MemoryRouter><CheckoutPage /></MemoryRouter>);
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("calcular-frete", expect.objectContaining({ body: expect.objectContaining({ subtotal: 200 }) })));
    await act(async () => { await Promise.resolve(); });
    next();
    await screen.findByRole("radio", { name: /Cartão/i });
    await act(async () => { await Promise.resolve(); });
    next();
    fireEvent.click(await screen.findByRole("button", { name: /Confirmar e Pagar/i }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("create-checkout-payment", expect.objectContaining({ body: expect.objectContaining({ expectedTotal: 180 }) })));
    await waitFor(() => expect(window.location.hash).toBe("#simulated-gateway"));
  });
  it.each([[62.91, true], [62.92, false]])("accepts exact cents only: gateway total %s", async (total, accepted) => {
    mocks.invoke.mockImplementation(async (name: string) => name === "calcular-frete"
      ? { data: { options: [{ id: "mock", company: "Mock", name: "Shipping", price: 0, free: true }] }, error: null }
      : { data: { url: "#simulated-gateway", validated: { total } }, error: null });
    await reviewPix();
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("create-checkout-payment", expect.objectContaining({ body: expect.objectContaining({ metodoPagamento: "pix" }) })));
    if (accepted) await waitFor(() => expect(window.location.hash).toBe("#simulated-gateway"));
    else { await waitFor(() => expect(mocks.error).toHaveBeenCalled()); expect(window.location.hash).toBe(""); }
  });

  it("simulated: Pix crossing the R$150 threshold re-quotes, keeps the chosen service with its NEW price and sends the client total only as drift check", async () => {
    // Server quote (mocked): card base 159.60 ≥ 150 → free; Pix base 143.64 < 150 → paid R$ 18,50.
    mocks.invoke.mockImplementation(async (name: string, opts: { body: { metodo_pagamento?: string } }) => {
      if (name === "calcular-frete") {
        const pix = opts.body.metodo_pagamento === "pix";
        return { data: { free_shipping: !pix, options: [{ id: "mock", company: "Mock", name: "Shipping", price: pix ? 18.5 : 0, free: !pix }] }, error: null };
      }
      return { data: { url: "#simulated-gateway", validated: { total: 81.41 } }, error: null };
    });
    await reviewPix();
    // 69.90 Pix = 62.91 + 18.50 frete = 81.41: price of the SAME selected service was updated.
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("create-checkout-payment", expect.objectContaining({
      body: expect.objectContaining({ metodoPagamento: "pix", freteServicoId: "mock", expectedTotal: 81.41 }) })));
    await waitFor(() => expect(window.location.hash).toBe("#simulated-gateway"));
  });

  it("simulated: server 409 total_drift is shown and no gateway redirect happens", async () => {
    mocks.invoke.mockImplementation(async (name: string) => name === "calcular-frete"
      ? { data: { options: [{ id: "mock", company: "Mock", name: "Shipping", price: 0, free: true }] }, error: null }
      : { data: null, error: { context: { status: 409, json: async () => ({ code: "total_drift", validated: { total: 80.41 } }) } } });
    await reviewPix();
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining("80,41")));
    expect(window.location.hash).toBe("");
  });

  it("simulated: changing CEP re-quotes; chosen service survives with new price, or falls back to cheapest when no longer offered", async () => {
    const quotes: Record<string, Array<{ id: string; price: number }>> = {
      "01001000": [{ id: "a", price: 10 }, { id: "b", price: 20 }],
      "20040002": [{ id: "b", price: 25 }, { id: "c", price: 5 }],
      "30140071": [{ id: "c", price: 7 }],
    };
    mocks.invoke.mockImplementation(async (_n: string, opts: { body: { cep_destino: string } }) => ({
      data: { options: (quotes[opts.body.cep_destino] || []).map((o) => ({ ...o, company: "Mock", name: o.id.toUpperCase(), free: false })) }, error: null }));
    render(<MemoryRouter><CheckoutPage /></MemoryRouter>);
    const fill = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
    const next = () => fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
    fill("checkout-nome", "Simulated Customer"); fill("checkout-email", "mock@example.invalid"); next();
    await waitFor(() => expect(document.getElementById("checkout-cep")).toBeTruthy());
    for (const [id, value] of Object.entries({ cep: "01001000", logradouro: "Mock", numero: "1", bairro: "Mock", cidade: "Mock", estado: "SP" })) fill(`checkout-${id}`, value);
    next();
    fireEvent.click(await screen.findByRole("radio", { name: "Mock · B" }));
    const back = async (cep: string) => {
      fireEvent.click(screen.getByRole("button", { name: /Voltar/i }));
      await waitFor(() => expect(document.getElementById("checkout-cep")).toBeTruthy());
      fill("checkout-cep", cep); next();
      await screen.findByRole("radio", { name: `Mock · ${quotes[cep][0].id.toUpperCase()}` });
      await act(async () => { await Promise.resolve(); });
    };
    await back("20040002");
    expect(screen.getByRole("radio", { name: "Mock · B" })).toBeChecked();
    expect(screen.getAllByText(/25,00/).length).toBeGreaterThan(0);
    await back("30140071");
    expect(screen.getByRole("radio", { name: "Mock · C" })).toBeChecked();
  });
});
