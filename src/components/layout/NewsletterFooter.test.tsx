import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import NewsletterFooter from "./NewsletterFooter";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));
afterEach(cleanup);

describe("BAM-181 newsletter accessibility regression", () => {
  it("names the email field and preserves mobile 16px/touch sizing", () => {
    render(<NewsletterFooter />);
    const input = screen.getByRole("textbox", { name: "Seu e-mail para receber novidades" });
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveClass("text-base", "h-11", "min-w-0");
  });
  it("keeps the CTA readable without subscribing during rendering", () => {
    render(<NewsletterFooter />);
    const button = screen.getByRole("button", { name: "Inscrever" });
    expect(button).toHaveClass("text-foreground", "min-h-[44px]");
    expect(button).toHaveAttribute("aria-busy", "false");
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });
});
