import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Coffee, Search, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cafes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4 max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full border border-gold/25 flex items-center justify-center bg-gold/[0.03]">
          <Coffee className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-display text-6xl font-bold text-gradient-gold mb-4">404</h1>
        <p className="font-display text-xl text-foreground mb-2">Página não encontrada</p>
        <p className="font-body text-sm text-muted-foreground mb-8">
          A página que você procura pode ter sido removida ou não existe mais.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cafés…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-body"
            />
          </div>
          <Button type="submit" size="default" className="font-body text-sm">Buscar</Button>
        </form>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="font-body text-sm gap-2">
            <Link to="/"><Home className="w-4 h-4" /> Voltar ao Início</Link>
          </Button>
          <Button asChild variant="outline" className="font-body text-sm gap-2">
            <Link to="/cafes">Explorar Cafés <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>

        {/* Suggested pages */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="font-body text-xs text-muted-foreground mb-3">Páginas populares</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Cafés", to: "/cafes" },
              { label: "Assinatura", to: "/assinatura" },
              { label: "Sobre", to: "/sobre" },
              { label: "Blog", to: "/blog" },
              { label: "Contato", to: "/contato" },
            ].map((link) => (
              <Button asChild key={link.to} variant="ghost" size="sm" className="font-body text-xs">
                <Link to={link.to}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
