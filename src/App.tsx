import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";

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
// InstitucionalPages loaded via named lazy imports below

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

const LazyPolitica = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.PoliticaPrivacidadePage })));
const LazyTermos = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.TermosPage })));
const LazyFrete = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.FretePage })));
const LazyTrocas = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.TrocasPage })));
const LazyContato = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.ContatoPage })));
const LazyRastreamento = lazy(() => import("./pages/InstitucionalPages").then(m => ({ default: m.RastreamentoPage })));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse font-body text-muted-foreground">Carregando…</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cafes" element={<CafesPage />} />
              <Route path="/cafe/:slug" element={<ProdutoPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/conta" element={<ContaPage />} />
              <Route path="/assinatura" element={<AssinaturaPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/quiz" element={<QuizPage />} />
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
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
