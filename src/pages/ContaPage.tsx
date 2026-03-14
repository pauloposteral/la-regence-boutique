import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, MapPin, ShoppingBag, Heart, LogOut, Package, Clock, RefreshCw, Copy, Check, Trash2, AlertTriangle, Award, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente", confirmado: "Confirmado", preparando: "Preparando",
  enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground", confirmado: "bg-accent/10 text-accent",
  preparando: "bg-accent/20 text-accent", enviado: "bg-primary/10 text-primary",
  entregue: "bg-green-100 text-green-700", cancelado: "bg-destructive/10 text-destructive",
};

const ContaPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState({ full_name: "", phone: "", cpf: "", preferred_roast: "", preferred_grind: "" });
  const [saving, setSaving] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profileData) setProfile({ full_name: profileData.full_name || "", phone: profileData.phone || "", cpf: profileData.cpf || "", preferred_roast: profileData.preferred_roast || "", preferred_grind: profileData.preferred_grind || "" });
  }, [profileData]);

  const { data: pedidos = [], isLoading: pedidosLoading } = useQuery({
    queryKey: ["pedidos", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("*, itens_pedido(*, produtos(nome, slug))").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: favoritos = [], isLoading: favLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favoritos").select("*, produtos(id, nome, slug, preco, notas_sensoriais, produto_imagens(url, principal))").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: enderecos = [] } = useQuery({
    queryKey: ["enderecos", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("enderecos").select("*").eq("user_id", user!.id).order("principal", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pontosData } = useQuery({
    queryKey: ["pontos", user?.id],
    queryFn: async () => {
      const [{ data: historico }, { data: totalData }] = await Promise.all([
        supabase.from("pontos_fidelidade").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
        supabase.rpc("get_user_points", { _user_id: user!.id }),
      ]);
      return { historico: historico || [], total: (totalData as number) || 0 };
    },
    enabled: !!user,
  });

  const [redeeming, setRedeeming] = useState(false);

  const redeemPoints = async (pontos: number, desconto: number) => {
    if (!user || (pontosData?.total || 0) < pontos) {
      toast.error("Pontos insuficientes");
      return;
    }
    setRedeeming(true);
    // Create coupon and deduct points
    const codigo = `FIDELIDADE${Date.now().toString(36).toUpperCase()}`;
    const { error: cupomError } = await supabase.from("cupons").insert({
      codigo,
      desconto_valor: desconto,
      ativo: true,
      usos_restantes: 1,
      valido_ate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (cupomError) { toast.error("Erro ao criar cupom"); setRedeeming(false); return; }

    const { error: pontosError } = await supabase.from("pontos_fidelidade").insert({
      user_id: user.id,
      pontos: -pontos,
      tipo: "resgate",
      descricao: `Resgate: cupom ${codigo} (R$ ${desconto})`,
    });
    if (pontosError) { toast.error("Erro ao registrar resgate"); setRedeeming(false); return; }

    queryClient.invalidateQueries({ queryKey: ["pontos"] });
    setRedeeming(false);
    toast.success(`Cupom ${codigo} criado! R$ ${desconto} de desconto, válido por 30 dias.`, { duration: 8000 });
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: profile.full_name, phone: profile.phone, cpf: profile.cpf, preferred_roast: profile.preferred_roast || null, preferred_grind: profile.preferred_grind || null }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar perfil");
    else { toast.success("Perfil atualizado!"); queryClient.invalidateQueries({ queryKey: ["profile"] }); }
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("favoritos").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["favoritos"] });
    toast.success("Removido dos favoritos");
  };

  const reorderItems = (pedido: any) => {
    const items = pedido.itens_pedido || [];
    items.forEach((item: any) => {
      addItem({
        produtoId: item.produto_id,
        varianteId: item.variante_id || undefined,
        nome: item.produtos?.nome || "Produto",
        preco: Number(item.preco_unitario),
        quantidade: item.quantidade,
        slug: item.produtos?.slug || "",
      });
    });
    toast.success(`${items.length} itens adicionados ao carrinho!`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Até logo! ☕");
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Minha Conta</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-semibold">Minha Conta</h1>
            <p className="font-body text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="font-body text-sm text-muted-foreground"><LogOut className="w-4 h-4 mr-2" /> Sair</Button>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="bg-secondary/50 w-full justify-start overflow-x-auto">
            <TabsTrigger value="perfil" className="font-body text-xs gap-1.5"><User className="w-3.5 h-3.5" /> Perfil</TabsTrigger>
            <TabsTrigger value="pedidos" className="font-body text-xs gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Pedidos</TabsTrigger>
            <TabsTrigger value="pontos" className="font-body text-xs gap-1.5"><Award className="w-3.5 h-3.5" /> Pontos</TabsTrigger>
            <TabsTrigger value="enderecos" className="font-body text-xs gap-1.5"><MapPin className="w-3.5 h-3.5" /> Endereços</TabsTrigger>
            <TabsTrigger value="favoritos" className="font-body text-xs gap-1.5"><Heart className="w-3.5 h-3.5" /> Favoritos</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="perfil">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-6 space-y-4">
              {profileLoading ? (
                <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-1/3" /></div>
              ) : (
                <>
                  <h2 className="font-display text-lg font-semibold">Dados Pessoais</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label className="font-body text-xs">Nome completo</Label><Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} className="font-body" /></div>
                    <div><Label className="font-body text-xs">E-mail</Label><Input value={user?.email || ""} disabled className="font-body bg-muted/50" /></div>
                    <div><Label className="font-body text-xs">Telefone</Label><Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className="font-body" placeholder="(00) 00000-0000" /></div>
                    <div><Label className="font-body text-xs">CPF</Label><Input value={profile.cpf} onChange={(e) => setProfile((p) => ({ ...p, cpf: e.target.value }))} className="font-body" placeholder="000.000.000-00" /></div>
                   </div>
                  <Button onClick={saveProfile} disabled={saving} className="font-body text-sm bg-gold text-primary-foreground hover:bg-gold-light rounded-none uppercase tracking-wider">{saving ? "Salvando..." : "Salvar Alterações"}</Button>

                  {/* LGPD - Delete Account */}
                  <div className="border-t border-border pt-6 mt-6">
                    <h3 className="font-display text-base font-semibold text-destructive flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Zona de Perigo
                    </h3>
                    <p className="font-body text-xs text-muted-foreground mb-3">
                      Ao excluir sua conta, todos os seus dados pessoais serão removidos permanentemente conforme a LGPD.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="font-body text-xs gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" /> Excluir minha conta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-display">Excluir conta permanentemente?</AlertDialogTitle>
                          <AlertDialogDescription className="font-body text-sm">
                            Esta ação é irreversível. Todos os seus dados pessoais, favoritos, endereços e histórico serão apagados.
                            Pedidos anteriores serão mantidos anonimizados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                            onClick={async () => {
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                const res = await supabase.functions.invoke("delete-account", {
                                  headers: { Authorization: `Bearer ${session?.access_token}` },
                                });
                                if (res.error) throw res.error;
                                toast.success("Conta excluída com sucesso");
                                navigate("/");
                              } catch {
                                toast.error("Erro ao excluir conta. Tente novamente.");
                              }
                            }}
                          >
                            Sim, excluir tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </motion.div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="pedidos">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {pedidosLoading ? (
                <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : pedidos.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-10 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg mb-2">Nenhum pedido ainda</p>
                  <p className="font-body text-sm text-muted-foreground mb-4">Explore nossos cafés especiais!</p>
                  <Button asChild variant="outline"><Link to="/cafes">Ver Cafés</Link></Button>
                </div>
              ) : (
                pedidos.map((pedido: any) => (
                  <div key={pedido.id} className="bg-card border border-border rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-body text-xs text-muted-foreground">Pedido #{pedido.id.slice(0, 8).toUpperCase()}</p>
                        <p className="font-body text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(pedido.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <Badge className={`${STATUS_COLORS[pedido.status]} font-body text-[10px]`}>{STATUS_LABELS[pedido.status] || pedido.status}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-4">
                      {["pendente", "confirmado", "preparando", "enviado", "entregue"].map((s, i, arr) => {
                        const statusOrder = arr.indexOf(pedido.status);
                        const done = i <= statusOrder && pedido.status !== "cancelado";
                        return (
                          <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className={`w-2.5 h-2.5 rounded-full ${done ? "bg-gold" : "bg-border"}`} />
                            {i < arr.length - 1 && <div className={`flex-1 h-px ${done && i < statusOrder ? "bg-gold" : "bg-border"}`} />}
                          </div>
                        );
                      })}
                    </div>
                    {pedido.codigo_rastreamento && (
                      <TrackingCode code={pedido.codigo_rastreamento} />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {(pedido.itens_pedido || []).slice(0, 3).map((item: any) => (
                          <div key={item.id} className="w-10 h-10 bg-secondary rounded flex items-center justify-center text-xs">☕</div>
                        ))}
                        {(pedido.itens_pedido || []).length > 3 && <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs font-body text-muted-foreground">+{pedido.itens_pedido.length - 3}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="font-body text-xs gap-1" onClick={() => reorderItems(pedido)}>
                          <RefreshCw className="w-3 h-3" /> Comprar novamente
                        </Button>
                        <p className="font-body font-semibold text-sm">R$ {Number(pedido.total).toFixed(2).replace(".", ",")}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="pontos">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20 rounded-lg p-6 text-center">
                <Award className="w-10 h-10 text-gold mx-auto mb-2" />
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Seus Pontos</p>
                <p className="font-display text-4xl font-bold text-gold">{pontosData?.total || 0}</p>
                <p className="font-body text-xs text-muted-foreground mt-2">Ganhe 1 ponto por cada R$ 1 em compras entregues</p>
              </div>

              {/* Redemption Options */}
              <div>
                <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-gold" /> Trocar Pontos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { pontos: 100, desconto: 10 },
                    { pontos: 250, desconto: 30 },
                    { pontos: 500, desconto: 70 },
                  ].map((opt) => (
                    <div key={opt.pontos} className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="font-display text-lg font-bold">{opt.pontos} pts</p>
                      <p className="font-body text-sm text-gold font-medium">R$ {opt.desconto} de desconto</p>
                      <Button
                        size="sm"
                        variant={(pontosData?.total || 0) >= opt.pontos ? "default" : "outline"}
                        className="mt-3 font-body text-xs w-full"
                        disabled={(pontosData?.total || 0) < opt.pontos || redeeming}
                        onClick={() => redeemPoints(opt.pontos, opt.desconto)}
                      >
                        {(pontosData?.total || 0) >= opt.pontos ? "Resgatar" : `Faltam ${opt.pontos - (pontosData?.total || 0)} pts`}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              {(pontosData?.historico?.length || 0) > 0 && (
                <div>
                  <h3 className="font-display text-base font-semibold mb-3">Histórico</h3>
                  <div className="space-y-2">
                    {pontosData!.historico.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
                        <div>
                          <p className="font-body text-sm">{item.descricao}</p>
                          <p className="font-body text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <span className={`font-display font-bold text-sm ${item.pontos > 0 ? "text-green-600" : "text-destructive"}`}>
                          {item.pontos > 0 ? "+" : ""}{item.pontos} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(pontosData?.historico?.length || 0) === 0 && (
                <div className="bg-card border border-border rounded-lg p-10 text-center">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg mb-2">Nenhum ponto ainda</p>
                  <p className="font-body text-sm text-muted-foreground mb-4">Faça uma compra e ganhe pontos quando ela for entregue!</p>
                  <Button asChild variant="outline"><Link to="/cafes">Comprar Cafés</Link></Button>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="enderecos">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {enderecos.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-10 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg mb-2">Nenhum endereço salvo</p>
                  <p className="font-body text-sm text-muted-foreground">Seus endereços serão salvos durante o checkout.</p>
                </div>
              ) : (
                enderecos.map((end: any) => (
                  <div key={end.id} className="bg-card border border-border rounded-lg p-5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-body font-medium text-sm">{end.apelido || "Endereço"}</p>
                        {end.principal && <Badge variant="secondary" className="font-body text-[10px]">Principal</Badge>}
                      </div>
                      <p className="font-body text-sm text-muted-foreground">{end.logradouro}, {end.numero}{end.complemento ? ` — ${end.complemento}` : ""}</p>
                      <p className="font-body text-sm text-muted-foreground">{end.bairro} · {end.cidade}/{end.estado} · CEP {end.cep}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favoritos">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {favLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
              ) : favoritos.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-10 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg mb-2">Nenhum favorito</p>
                  <p className="font-body text-sm text-muted-foreground mb-4">Adicione cafés aos favoritos clicando no ♡</p>
                  <Button asChild variant="outline"><Link to="/cafes">Explorar Cafés</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoritos.map((fav: any) => {
                    const p = fav.produtos;
                    if (!p) return null;
                    const img = p.produto_imagens?.find((i: any) => i.principal)?.url || p.produto_imagens?.[0]?.url;
                    return (
                      <div key={fav.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
                        <Link to={`/cafe/${p.slug}`} className="w-20 h-20 bg-secondary rounded flex items-center justify-center shrink-0">
                          {img ? <img src={img} alt={p.nome} className="w-full h-full object-cover rounded" loading="lazy" /> : <span className="text-3xl">☕</span>}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/cafe/${p.slug}`} className="font-body font-medium text-sm hover:text-gold transition-colors duration-300">{p.nome}</Link>
                          <p className="font-body text-sm font-semibold mt-1">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</p>
                          <button onClick={() => removeFavorite(fav.id)} className="text-xs font-body text-destructive hover:underline mt-2">Remover</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

function TrackingCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded px-3 py-1.5 mb-3">
      <span className="font-body text-xs text-muted-foreground">Rastreamento:</span>
      <span className="font-mono text-xs font-medium">{code}</span>
      <button onClick={handleCopy} className="ml-auto p-1 hover:bg-muted rounded transition-colors" aria-label="Copiar código">
        {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default ContaPage;
