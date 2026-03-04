import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Image, FolderTree,
  Users, FileText, Coffee, Menu, X, LogOut, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/produtos", icon: Package, label: "Produtos" },
  { to: "/admin/pedidos", icon: ShoppingCart, label: "Pedidos" },
  { to: "/admin/categorias", icon: FolderTree, label: "Categorias" },
  { to: "/admin/cupons", icon: Tag, label: "Cupons" },
  { to: "/admin/banners", icon: Image, label: "Banners" },
  { to: "/admin/assinaturas", icon: Coffee, label: "Assinaturas" },
  { to: "/admin/clientes", icon: Users, label: "Clientes" },
  { to: "/admin/blog", icon: FileText, label: "Blog" },
];

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border shrink-0">
          <Coffee className="w-5 h-5 text-sidebar-primary" />
          <span className="font-display text-lg font-semibold">La Régence</span>
          <span className="text-[10px] font-body bg-sidebar-accent px-1.5 py-0.5 rounded ml-auto">Admin</span>
          <button className="lg:hidden ml-2" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/admin" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-xs font-body text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <ChevronRight className="w-3 h-3" /> Voltar à loja
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-xs font-body text-sidebar-foreground/50 hover:text-destructive transition-colors w-full"
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
          <div className="ml-auto font-body text-xs text-muted-foreground">
            {user?.email}
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
