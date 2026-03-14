import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, ShoppingCart, Award, Coffee, AlertTriangle, CalendarDays,
  Package, Users, Eye, Plus, Download, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "hsl(45, 80%, 50%)",
  confirmado: "hsl(210, 70%, 55%)",
  preparando: "hsl(30, 75%, 55%)",
  enviado: "hsl(270, 55%, 55%)",
  entregue: "hsl(142, 50%, 40%)",
  cancelado: "hsl(0, 62%, 50%)",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const AdminDashboard = () => {
  const [days, setDays] = useState(30);
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

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const [pedidos, produtos, assinaturas, itensPedido, profiles] = await Promise.all([
        supabase.from("pedidos").select("id, total, status, created_at, order_number, email_visitante"),
        supabase.from("produtos").select("id, nome, estoque, estoque_minimo, ativo, preco"),
        supabase.from("assinaturas").select("id, status, preco, tipo"),
        supabase.from("itens_pedido").select("produto_id, quantidade, subtotal, pedido_id, pedidos(created_at, status)"),
        supabase.from("profiles").select("id, created_at"),
      ]);

      const allOrders = pedidos.data || [];
      const allProducts = produtos.data || [];
      const allSubs = assinaturas.data || [];
      const activeSubs = allSubs.filter((s) => s.status === "ativa");
      const allItems = itensPedido.data || [];
      const allProfiles = profiles.data || [];

      const rangeOrders = allOrders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= dateRange.from && d <= dateRange.to;
      });

      const revenue = rangeOrders.reduce((acc, o) => acc + Number(o.total), 0);
      const ticketMedio = rangeOrders.length > 0 ? revenue / rangeOrders.length : 0;
      const lowStock = allProducts.filter((p) => p.ativo && p.estoque <= p.estoque_minimo).sort((a, b) => a.estoque - b.estoque).slice(0, 10);
      const activeProducts = allProducts.filter((p) => p.ativo).length;

      // New customers in range
      const newCustomers = allProfiles.filter((p) => {
        const d = new Date(p.created_at);
        return d >= dateRange.from && d <= dateRange.to;
      }).length;

      // Previous period for comparison
      const diffMs = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - diffMs);
      const prevTo = new Date(dateRange.from.getTime());
      const prevOrders = allOrders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= prevFrom && d <= prevTo;
      });
      const prevRevenue = prevOrders.reduce((acc, o) => acc + Number(o.total), 0);
      const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordersChange = prevOrders.length > 0 ? ((rangeOrders.length - prevOrders.length) / prevOrders.length) * 100 : 0;

      // Pending orders count
      const pendingOrders = allOrders.filter((o) => o.status === "pendente").length;

      // Status distribution (pie chart)
      const statusCounts: Record<string, number> = {};
      rangeOrders.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const pieData = Object.entries(statusCounts).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        color: STATUS_COLORS[status] || "hsl(0,0%,60%)",
      }));

      // Top 5 products
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
      const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

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

      // Last 5 orders
      const recentOrders = allOrders.slice(0, 5);

      return {
        totalOrders: allOrders.length,
        rangeOrders: rangeOrders.length,
        revenue,
        ticketMedio,
        activeProducts,
        activeSubs: activeSubs.length,
        subRevenue: activeSubs.reduce((a, s) => a + Number(s.preco), 0),
        lowStock,
        chart,
        topProducts,
        pieData,
        recentOrders,
        pendingOrders,
        newCustomers,
        revenueChange,
        ordersChange,
      };
    },
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const cards = [
    { label: "Receita no período", value: fmt(stats?.revenue || 0), icon: TrendingUp, color: "text-green-600", change: stats?.revenueChange },
    { label: "Pedidos no período", value: stats?.rangeOrders || 0, icon: ShoppingCart, color: "text-accent", change: stats?.ordersChange },
    { label: "Ticket médio", value: fmt(stats?.ticketMedio || 0), icon: Award, color: "text-blue-600" },
    { label: "Assinaturas ativas", value: stats?.activeSubs || 0, icon: Coffee, color: "text-purple-600" },
    { label: "Produtos ativos", value: stats?.activeProducts || 0, icon: Package, color: "text-gold" },
    { label: "Estoque baixo", value: stats?.lowStock?.length || 0, icon: AlertTriangle, color: "text-destructive" },
    { label: "Novos clientes", value: stats?.newCustomers || 0, icon: Users, color: "text-emerald-600" },
    { label: "Receita recorrente/mês", value: fmt(stats?.subRevenue || 0), icon: TrendingUp, color: "text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="gap-1.5 font-body text-xs">
          <Link to="/admin/produtos"><Plus className="w-3.5 h-3.5" /> Novo Produto</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5 font-body text-xs">
          <Link to="/admin/pedidos"><Eye className="w-3.5 h-3.5" /> Pedidos Pendentes ({stats?.pendingOrders || 0})</Link>
        </Button>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-body text-[11px] text-muted-foreground">{c.label}</p>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="font-display text-xl font-bold">{c.value}</p>
              {c.change !== undefined && c.change !== 0 && (
                <div className={`flex items-center gap-1 mt-1 text-[10px] font-body font-medium ${c.change > 0 ? "text-green-600" : "text-destructive"}`}>
                  {c.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(c.change).toFixed(1)}% vs período anterior
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Receita & Pedidos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats?.chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 20%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number, name: string) => name === "receita" ? fmt(v) : v} />
                <Bar yAxisId="left" dataKey="pedidos" fill="hsl(38, 42%, 58%)" radius={[4, 4, 0, 0]} opacity={0.7} name="Pedidos" />
                <Line yAxisId="right" type="monotone" dataKey="receita" stroke="hsl(25, 45%, 22%)" strokeWidth={2} dot={{ r: 2 }} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Status dos Pedidos</CardTitle></CardHeader>
          <CardContent>
            {(stats?.pieData?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats?.pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats?.pieData?.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground font-body">Sem pedidos no período</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top 5 Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" /> Top 5 Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.topProducts?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {stats!.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between font-body text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">{i + 1}</span>
                      <span className="truncate max-w-[180px]">{p.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{p.qty} un.</span>
                      <span className="font-medium text-foreground">{fmt(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-body py-6 text-center">Sem vendas no período</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-accent" /> Últimos Pedidos
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="font-body text-xs">
                <Link to="/admin/pedidos">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(stats?.recentOrders || []).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between font-body text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gold">
                      {o.order_number ? `#${o.order_number}` : `#${o.id.slice(0, 8)}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] capitalize font-body">{o.status}</Badge>
                    <span className="font-medium text-xs">{fmt(Number(o.total))}</span>
                  </div>
                </div>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <p className="text-sm text-muted-foreground font-body py-6 text-center">Nenhum pedido</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Report */}
      {(stats?.lowStock?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Relatório de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats!.lowStock.map((p: any) => {
                const pct = p.estoque_minimo > 0 ? Math.min(100, (p.estoque / p.estoque_minimo) * 100) : 0;
                const color = pct <= 25 ? "bg-destructive" : pct <= 60 ? "bg-yellow-500" : "bg-green-500";
                return (
                  <div key={p.id} className="flex items-center gap-4">
                    <span className="font-body text-sm w-48 truncate">{p.nome}</span>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="font-body text-xs text-muted-foreground w-16 text-right">{p.estoque} / {p.estoque_minimo}</span>
                    <Badge variant={pct <= 25 ? "destructive" : "secondary"} className="font-body text-[10px]">
                      {pct <= 25 ? "Crítico" : pct <= 60 ? "Baixo" : "OK"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
