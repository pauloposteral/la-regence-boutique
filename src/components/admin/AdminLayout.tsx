import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Image, FolderTree,
  Users, FileText, Coffee, Menu, X, LogOut, ChevronRight, Layers, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/produtos", icon: Package, label: "Produtos" },
  { to: "/admin/pedidos", icon: ShoppingCart, label: "Pedidos", badgeKey: "pendingOrders" as const },
  { to: "/admin/categorias", icon: FolderTree, label: "Categorias" },
  { to: "/admin/cupons", icon: Tag, label: "Cupons" },
  { to: "/admin/banners", icon: Image, label: "Banners" },
  { to: "/admin/assinaturas", icon: Coffee, label: "Assinaturas" },
  { to: "/admin/clientes", icon: Users, label: "Clientes" },
  { to: "/admin/blog", icon: FileText, label: "Blog" },
  { to: "/admin/colecoes", icon: Layers, label: "Coleções" },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/produtos": "Produtos",
  "/admin/pedidos": "Pedidos",
  "/admin/categorias": "Categorias",
  "/admin/cupons": "Cupons",
  "/admin/banners": "Banners",
  "/admin/assinaturas": "Assinaturas",
  "/admin/clientes": "Clientes",
  "/admin/blog": "Blog",
  "/admin/colecoes": "Coleções",
};

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      return !!data;
    },
    enabled: !!user,
  });

  // Pending orders count for badge
  const { data: pendingOrders = 0 } = useQuery({
    queryKey: ["admin-pending-orders-count"],
    queryFn: async () => {
      const { count } = await supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("status", "pendente");
      return count || 0;
    },
    enabled: !!user && !!isAdmin,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && user && isAdmin === false) navigate("/");
  }, [isLoading, user, isAdmin, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-body text-muted-foreground">Verificando permissões…</div>
      </div>
    );
  }

  const badges: Record<string, number> = { pendingOrders };
  const currentBreadcrumb = BREADCRUMB_LABELS[location.pathname] || "Admin";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-gold shrink-0">
            <img src="/favicon.jpeg" alt="La Régence" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-lg font-semibold">La Régence</span>
          <span className="text-[10px] font-body bg-gold/10 text-gold px-1.5 py-0.5 ml-auto tracking-wider uppercase">Admin</span>
          <button className="lg:hidden ml-2" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/admin" && location.pathname.startsWith(item.to));
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-colors rounded-lg",
                  active
                    ? "bg-gold/10 text-gold font-medium"
                    : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] h-5 min-w-[20px] px-1.5 font-body">
                    {badgeCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-xs font-body text-muted-foreground hover:text-gold transition-colors">
            <ChevronRight className="w-3 h-3" /> Voltar à loja
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-xs font-body text-muted-foreground hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-3 h-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-4 px-4 lg:px-8 border-b border-border bg-background shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-body">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            {location.pathname !== "/admin" && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-foreground font-medium">{currentBreadcrumb}</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-body text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {now.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <span className="font-body text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
