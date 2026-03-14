import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CompareProvider } from "@/contexts/CompareContext";

import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";

// Eager: critical path
import Index from "./pages/Index";
import CafesPage from "./pages/CafesPage";
import ProdutoPage from "./pages/ProdutoPage";
import NotFound from "./pages/NotFound";

// Lazy: secondary pages
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ContaPage = lazy(() => import("./pages/ContaPage"));
const AssinaturaPage = lazy(() => import("./pages/AssinaturaPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const SobrePage = lazy(() => import("./pages/SobrePage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const PagamentoSucessoPage = lazy(() => import("./pages/PagamentoSucessoPage"));
const FavoritosPage = lazy(() => import("./pages/FavoritosPage"));
const CompararPage = lazy(() => import("./pages/CompararPage"));

// Lazy: admin (heavy)
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProdutos = lazy(() => import("./pages/admin/AdminProdutos"));
const AdminPedidos = lazy(() => import("./pages/admin/AdminPedidos"));
const AdminCategorias = lazy(() => import("./pages/admin/AdminCategorias"));
const AdminCupons = lazy(() => import("./pages/admin/AdminCupons"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminAssinaturas = lazy(() => import("./pages/admin/AdminAssinaturas"));
const AdminClientes = lazy(() => import("./pages/admin/AdminClientes"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminCollections = lazy(() => import("./pages/admin/AdminCollections"));

const LazyPolitica = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.PoliticaPrivacidadePage })));
const LazyTermos = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.TermosPage })));
const LazyFrete = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.FretePage })));
const LazyTrocas = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.TrocasPage })));
const LazyContato = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.ContatoPage })));
const LazyRastreamento = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.RastreamentoPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Loading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
    <div className="w-16 h-16 rounded-full border border-gold/25 flex items-center justify-center bg-gold/[0.03] animate-pulse">
      <span className="font-display text-sm font-semibold text-gold">LR</span>
    </div>
    <span className="font-body text-xs text-muted-foreground tracking-[0.2em] uppercase animate-pulse">Carregando…</span>
  </div>
);

const App = () => (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <CompareProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/cafes" element={<CafesPage />} />
                  <Route path="/cafe/:slug" element={<ProdutoPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/conta" element={<ProtectedRoute><ContaPage /></ProtectedRoute>} />
                  <Route path="/assinatura" element={<AssinaturaPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/sobre" element={<SobrePage />} />
                  <Route path="/quiz" element={<QuizPage />} />
                  <Route path="/pagamento-sucesso" element={<PagamentoSucessoPage />} />
                  <Route path="/favoritos" element={<FavoritosPage />} />
                  <Route path="/comparar" element={<CompararPage />} />
                  <Route path="/contato" element={<LazyContato />} />
                  <Route path="/politica-privacidade" element={<LazyPolitica />} />
                  <Route path="/termos" element={<LazyTermos />} />
                  <Route path="/frete" element={<LazyFrete />} />
                  <Route path="/trocas" element={<LazyTrocas />} />
                  <Route path="/rastreamento" element={<LazyRastreamento />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="produtos" element={<AdminProdutos />} />
                    <Route path="pedidos" element={<AdminPedidos />} />
                    <Route path="categorias" element={<AdminCategorias />} />
                    <Route path="cupons" element={<AdminCupons />} />
                    <Route path="banners" element={<AdminBanners />} />
                    <Route path="assinaturas" element={<AdminAssinaturas />} />
                    <Route path="clientes" element={<AdminClientes />} />
                    <Route path="blog" element={<AdminBlog />} />
                    <Route path="colecoes" element={<AdminCollections />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
        </CompareProvider>
      </CartProvider>
    </QueryClientProvider>
);

export default App;
