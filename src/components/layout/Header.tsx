import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, Menu, X, Moon, Sun, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const navLinks = [
  { label: "Cafés", href: "/cafes" },
  { label: "Assinatura", href: "/assinatura" },
  { label: "Sobre", href: "/sobre" },
  { label: "Blog", href: "/blog" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const debouncedSearch = useDebounce(searchQuery, 250);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: favCount = 0 } = useQuery({
    queryKey: ["fav-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase.from("favoritos").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

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
      <div className="bg-primary text-primary-foreground text-center text-xs py-2 font-body tracking-wide">
        Frete grátis para compras acima de R$ 150 · Torrefação artesanal desde 2006
      </div>

      <header className={`sticky top-0 z-50 border-b border-border transition-all duration-300 ${
        scrolled 
          ? "bg-background/98 backdrop-blur-lg shadow-md" 
          : "bg-background/95 backdrop-blur-md"
      }`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16 lg:h-20">
            {/* LEFT — Nav links (desktop) / Hamburger (mobile) */}
            <div className="flex items-center">
              <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <nav className="hidden lg:flex items-center gap-7">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent transition-all group-hover:w-full" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* CENTER — Brand */}
            <Link to="/" className="flex items-center justify-center">
              <span className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground whitespace-nowrap">
                La <span className="text-gradient-gold italic">Régence</span>
              </span>
            </Link>

            {/* RIGHT — Icons */}
            <div className="flex items-center justify-end gap-1 lg:gap-2">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema" className="hidden lg:inline-flex">
                <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }} aria-label="Buscar">
                <Search className="w-4 h-4" />
              </Button>
              {user && (
                <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex" asChild aria-label="Favoritos">
                  <Link to="/favoritos">
                    <Heart className="w-4 h-4" />
                    {favCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{favCount}</span>
                    )}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild aria-label="Minha conta">
                <Link to={user ? "/conta" : "/auth"}>
                  <User className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="relative" aria-label="Carrinho" onClick={openCart}>
                <ShoppingBag className="w-4 h-4" />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search bar with autocomplete */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              ref={searchRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-visible relative"
            >
              <div className="container mx-auto px-4 py-3">
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Buscar cafés, métodos de preparo..."
                    className="w-full bg-transparent text-sm font-body outline-none placeholder:text-muted-foreground"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 bg-background border-b border-border shadow-lg z-50">
                  <div className="container mx-auto px-4 py-2">
                    {searchResults.map((r: any) => (
                      <Link
                        key={r.slug}
                        to={`/cafe/${r.slug}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-muted/50 transition-colors"
                        onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                      >
                        <div className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0">
                          {r.img ? <img src={r.img} alt="" className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center">☕</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium truncate">{r.nome}</p>
                        </div>
                        <span className="font-body text-sm font-semibold text-accent shrink-0">R$ {Number(r.preco).toFixed(2).replace(".", ",")}</span>
                      </Link>
                    ))}
                    <Link
                      to={`/cafes?q=${encodeURIComponent(searchQuery)}`}
                      className="block text-center text-xs font-body text-accent hover:underline py-2"
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    >
                      Ver todos os resultados →
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border overflow-hidden backdrop-blur-lg bg-background/98"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm font-body font-medium text-muted-foreground hover:text-foreground py-2 border-b border-border/50 last:border-0 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
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
