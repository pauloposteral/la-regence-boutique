import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { cartPixTotal, pixPrice as calculatePixPrice, safePixPrice } from "@/lib/money";

// Real component renders (no network): screens must show the shared Pix cent rule.
const cart = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/contexts/CartContext", () => ({ useCart: () => cart.value }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));
vi.mock("@/components/cart/CrossSellProducts", () => ({ default: () => null }));

import QuickViewModal from "@/components/product/QuickViewModal";
import CartDrawer from "@/components/cart/CartDrawer";

const base = { isOpen: true, closeCart: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), addItem: vi.fn(), openCart: vi.fn(),
  setCupom: vi.fn(), setDesconto: vi.fn(), setCupomTipo: vi.fn(), cupomTipo: null };
const item = { produtoId: "p1", varianteId: null, nome: "Café Teste", slug: "cafe-teste", preco: 23.65, quantidade: 1, imagemUrl: "" };

describe("Pix display uses the shared cent rule", () => {
  it("helper boundaries: 23.65 -> 21.28, 0.05 -> 0.04, invalid stays NaN", () => {
    expect(calculatePixPrice(23.65)).toBe(21.28);
    expect(calculatePixPrice(0.05)).toBe(0.04);
    expect(safePixPrice(NaN)).toBeNaN();
    expect(safePixPrice("bad")).toBeNaN();
  });

  it("product preview card shows R$ 21,28 for R$ 23,65", () => {
    cart.value = base;
    render(<MemoryRouter><QuickViewModal open onOpenChange={() => {}}
      produto={{ id: "p1", nome: "Café Teste", slug: "cafe-teste", preco: 23.65, preco_promocional: null, imagens: [] } as never} /></MemoryRouter>);
    expect(screen.getByText(/21,28 no Pix/)).toBeInTheDocument();
    expect(screen.queryByText(/21,29/)).toBeNull();
  });

  it("cart applies Pix after coupon on merchandise, never on shipping", () => {
    cart.value = { ...base, items: [item], subtotal: 23.65, totalItems: 1, cupom: null, desconto: 0 };
    const { unmount } = render(<MemoryRouter><CartDrawer /></MemoryRouter>);
    expect(screen.getByText(/21,28 no Pix/)).toBeInTheDocument();
    unmount();
    cart.value = { ...base, items: [{ ...item, preco: 100 }], subtotal: 100, totalItems: 1, cupom: "X10", desconto: 10 };
    render(<MemoryRouter><CartDrawer /></MemoryRouter>);
    expect(cartPixTotal(100, 10)).toBe(81);
    expect(screen.getByText(/81,00 no Pix/)).toBeInTheDocument();
  });
});
