import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const navLinks = [
  { label: "Cafés", href: "/cafes" },
  { label: "Assinatura", href: "/assinatura" },
  { label: "Kits", href: "/cafes" },
  { label: "Acessórios", href: "/cafes" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(searchQuery, 250);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults = [] } = useQuery({
    queryKey: ["header-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const { data } = await supabase
        .from("produtos")
        .select("nome, slug, preco, produto_imagens(url, principal)")
        .eq("ativo", true)
        .ilike("nome", `%${debouncedSearch}%`)
        .limit(5);
      return (data || []).map((p: any) => ({
        ...p,
        img: p.produto_imagens?.find((i: any) => i.principal)?.url || p.produto_imagens?.[0]?.url,
      }));
    },
    enabled: debouncedSearch.length >= 2,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cafes?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-[11px] py-2.5 font-body tracking-[0.15em] uppercase">
        Frete grátis para compras acima de R$ 150 · Torrefação artesanal desde 2006
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-card/98 backdrop-blur-lg shadow-sm border-border"
          : "bg-card border-border"
      }`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16 lg:h-[72px]">
            {/* LEFT — Nav */}
            <div className="flex items-center">
              <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <nav className="hidden lg:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-[13px] font-body font-medium text-foreground/70 hover:text-foreground transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] transition-all group-hover:w-full" style={{ backgroundColor: "hsl(var(--gold))" }} />
                  </Link>
                ))}
              </nav>
            </div>

            {/* CENTER — Logo */}
            <Link to="/" className="flex flex-col items-center justify-center">
              <span className="text-lg leading-none mb-0.5" style={{ color: "hsl(var(--wine))" }}>☕</span>
              <span className="font-display text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: "hsl(var(--wine))" }}>
                La Régence
              </span>
            </Link>

            {/* RIGHT — Icons */}
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }} aria-label="Buscar" className="text-foreground/70 hover:text-foreground">
                <Search className="w-[18px] h-[18px]" />
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Minha conta" className="text-foreground/70 hover:text-foreground">
                <Link to={user ? "/conta" : "/auth"}>
                  <User className="w-[18px] h-[18px]" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground" aria-label="Carrinho" onClick={openCart}>
                <ShoppingBag className="w-[18px] h-[18px]" />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "hsl(var(--gold))", color: "hsl(var(--primary))" }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div ref={searchRef} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border overflow-visible relative">
              <div className="container mx-auto px-4 py-3">
                <form onSubmit={handleSearch}>
                  <input type="text" placeholder="Buscar cafés..." className="w-full bg-transparent text-sm font-body outline-none placeholder:text-muted-foreground" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </form>
              </div>
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 bg-card border-b border-border shadow-lg z-50">
                  <div className="container mx-auto px-4 py-2">
                    {searchResults.map((r: any) => (
                      <Link key={r.slug} to={`/cafe/${r.slug}`} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-muted/50 transition-colors" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                        <div className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0">
                          {r.img ? <img src={r.img} alt="" className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center">☕</span>}
                        </div>
                        <p className="font-body text-sm font-medium truncate flex-1">{r.nome}</p>
                        <span className="font-body text-sm font-semibold shrink-0" style={{ color: "hsl(var(--gold))" }}>R$ {Number(r.preco).toFixed(2).replace(".", ",")}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden border-t border-border overflow-hidden bg-card">
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link key={link.label} to={link.href} className="text-sm font-body font-medium text-foreground/70 hover:text-foreground py-2 border-b border-border/50 last:border-0 transition-colors" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
