import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full border border-gold/25 flex items-center justify-center bg-gold/[0.03]">
          <Coffee className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-display text-6xl font-bold text-gradient-gold mb-4">404</h1>
        <p className="font-body text-lg text-muted-foreground mb-6">Página não encontrada</p>
        <Button asChild className="bg-gold text-primary-foreground hover:bg-gold-light rounded-none uppercase tracking-wider font-body text-sm">
          <Link to="/">Voltar ao Início</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
