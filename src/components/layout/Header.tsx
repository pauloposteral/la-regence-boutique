import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Cafés", href: "/cafes" },
  { label: "Assinatura", href: "/assinatura" },
  { label: "Sobre Nós", href: "/sobre" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-2 font-body tracking-wide">
        Frete grátis para compras acima de R$ 150 · Torrefação artesanal desde 2006
      </div>

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                La <span className="text-gradient-gold italic">Régence</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
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

            {/* Actions */}
            <div className="flex items-center gap-1 lg:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Buscar"
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Minha conta">
                <Link to={user ? "/conta" : "/auth"}>
                  <User className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="relative" aria-label="Carrinho" onClick={openCart}>
                <ShoppingBag className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <div className="container mx-auto px-4 py-3">
                <input
                  type="text"
                  placeholder="Buscar cafés, métodos de preparo..."
                  className="w-full bg-transparent text-sm font-body outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
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
              className="lg:hidden border-t border-border overflow-hidden"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm font-body font-medium text-muted-foreground hover:text-foreground py-2 border-b border-border/50 last:border-0"
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
