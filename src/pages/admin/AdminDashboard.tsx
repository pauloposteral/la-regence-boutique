import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pedidos, produtos, assinaturas] = await Promise.all([
        supabase.from("pedidos").select("total, status, created_at"),
        supabase.from("produtos").select("id, nome, estoque, estoque_minimo, ativo"),
        supabase.from("assinaturas").select("id, status, preco"),
      ]);

      const allOrders = pedidos.data || [];
      const allProducts = produtos.data || [];
      const activeSubs = (assinaturas.data || []).filter((s) => s.status === "ativa");

      const now = new Date();
      const thisMonth = allOrders.filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const revenue = thisMonth.reduce((acc, o) => acc + Number(o.total), 0);
      const lowStock = allProducts.filter((p) => p.ativo && p.estoque <= p.estoque_minimo);

      // Last 7 days chart data
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        const dayOrders = allOrders.filter((o) => o.created_at.slice(0, 10) === key);
        return {
          day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
          pedidos: dayOrders.length,
          receita: dayOrders.reduce((a, o) => a + Number(o.total), 0),
        };
      });

      return {
        totalOrders: allOrders.length,
        monthOrders: thisMonth.length,
        revenue,
        activeProducts: allProducts.filter((p) => p.ativo).length,
        activeSubs: activeSubs.length,
        subRevenue: activeSubs.reduce((a, s) => a + Number(s.preco), 0),
        lowStock,
        chart: last7,
      };
    },
  });

  const cards = [
    { label: "Receita do mês", value: `R$ ${(stats?.revenue || 0).toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-green-600" },
    { label: "Pedidos do mês", value: stats?.monthOrders || 0, icon: ShoppingCart, color: "text-accent" },
    { label: "Produtos ativos", value: stats?.activeProducts || 0, icon: Package, color: "text-blue-600" },
    { label: "Assinaturas ativas", value: stats?.activeSubs || 0, icon: Coffee, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-body text-xs text-muted-foreground">{c.label}</p>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="font-display text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Pedidos — Últimos 7 dias</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.chart || []}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="hsl(38, 65%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Receita — Últimos 7 dias</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats?.chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 20%, 85%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="receita" stroke="hsl(25, 45%, 22%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alerts */}
      {(stats?.lowStock?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats!.lowStock.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between font-body text-sm">
                  <span>{p.nome}</span>
                  <span className="text-destructive font-medium">{p.estoque} un.</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
