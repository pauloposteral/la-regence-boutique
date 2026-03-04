import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Coffee, CalendarDays, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

const AdminDashboard = () => {
  const [days, setDays] = useState(7);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dateRange = useMemo(() => {
    if (customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(customTo + "T23:59:59") };
    }
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { from, to };
  }, [days, customFrom, customTo]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const [pedidos, produtos, assinaturas, itensPedido] = await Promise.all([
        supabase.from("pedidos").select("total, status, created_at"),
        supabase.from("produtos").select("id, nome, estoque, estoque_minimo, ativo"),
        supabase.from("assinaturas").select("id, status, preco"),
        supabase.from("itens_pedido").select("produto_id, quantidade, subtotal, pedido_id, pedidos(created_at, status)"),
      ]);

      const allOrders = pedidos.data || [];
      const allProducts = produtos.data || [];
      const activeSubs = (assinaturas.data || []).filter((s) => s.status === "ativa");
      const allItems = itensPedido.data || [];

      const rangeOrders = allOrders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= dateRange.from && d <= dateRange.to;
      });

      const revenue = rangeOrders.reduce((acc, o) => acc + Number(o.total), 0);
      const lowStock = allProducts.filter((p) => p.ativo && p.estoque <= p.estoque_minimo);

      // Ticket médio
      const ticketMedio = rangeOrders.length > 0 ? revenue / rangeOrders.length : 0;

      // Top 5 produtos mais vendidos no período
      const rangeOrderIds = new Set(rangeOrders.map((o: any) => o.id));
      // We don't have order ids in rangeOrders directly, let's compute from items
      const rangeItems = allItems.filter((item: any) => {
        const d = new Date(item.pedidos?.created_at);
        return d >= dateRange.from && d <= dateRange.to;
      });

      const productSales: Record<string, { nome: string; qty: number; revenue: number }> = {};
      rangeItems.forEach((item: any) => {
        const pid = item.produto_id;
        if (!productSales[pid]) {
          const prod = allProducts.find((p) => p.id === pid);
          productSales[pid] = { nome: prod?.nome || "Desconhecido", qty: 0, revenue: 0 };
        }
        productSales[pid].qty += item.quantidade;
        productSales[pid].revenue += Number(item.subtotal);
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      // Chart data
      const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000);
      const chartDays = Math.min(diffDays, 30);
      const chart = Array.from({ length: chartDays }, (_, i) => {
        const d = new Date(dateRange.to);
        d.setDate(d.getDate() - (chartDays - 1 - i));
        const key = d.toISOString().slice(0, 10);
        const dayOrders = allOrders.filter((o) => o.created_at.slice(0, 10) === key);
        return {
          day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          pedidos: dayOrders.length,
          receita: dayOrders.reduce((a, o) => a + Number(o.total), 0),
        };
      });

      return {
        totalOrders: allOrders.length,
        rangeOrders: rangeOrders.length,
        revenue,
        activeProducts: allProducts.filter((p) => p.ativo).length,
        activeSubs: activeSubs.length,
        subRevenue: activeSubs.reduce((a, s) => a + Number(s.preco), 0),
        lowStock,
        chart,
        ticketMedio,
        topProducts,
      };
    },
  });

  const cards = [
    { label: "Receita no período", value: `R$ ${(stats?.revenue || 0).toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-green-600" },
    { label: "Pedidos no período", value: stats?.rangeOrders || 0, icon: ShoppingCart, color: "text-accent" },
    { label: "Ticket médio", value: `R$ ${(stats?.ticketMedio || 0).toFixed(2).replace(".", ",")}`, icon: Award, color: "text-blue-600" },
    { label: "Assinaturas ativas", value: stats?.activeSubs || 0, icon: Coffee, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <Button
              key={p.days}
              variant={days === p.days && !customFrom ? "default" : "outline"}
              size="sm"
              className="font-body text-xs"
              onClick={() => { setDays(p.days); setCustomFrom(""); setCustomTo(""); }}
            >
              {p.label}
            </Button>
          ))}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-32 font-body text-xs" />
            <span className="text-xs text-muted-foreground">a</span>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-32 font-body text-xs" />
          </div>
        </div>
      </div>

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
          <CardHeader><CardTitle className="font-display text-base">Pedidos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.chart || []}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="hsl(38, 65%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Receita</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats?.chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 20%, 85%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="receita" stroke="hsl(25, 45%, 22%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Products */}
      {(stats?.topProducts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" /> Top 5 Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats!.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between font-body text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">{i + 1}</span>
                    <span>{p.nome}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{p.qty} un.</span>
                    <span className="font-medium text-foreground">R$ {p.revenue.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
