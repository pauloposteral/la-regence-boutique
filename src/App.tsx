import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import CafesPage from "./pages/CafesPage";
import ProdutoPage from "./pages/ProdutoPage";
import CheckoutPage from "./pages/CheckoutPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ContaPage from "./pages/ContaPage";
import AssinaturaPage from "./pages/AssinaturaPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProdutos from "./pages/admin/AdminProdutos";
import AdminPedidos from "./pages/admin/AdminPedidos";
import AdminCategorias from "./pages/admin/AdminCategorias";
import AdminCupons from "./pages/admin/AdminCupons";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminAssinaturas from "./pages/admin/AdminAssinaturas";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminBlog from "./pages/admin/AdminBlog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cafes" element={<CafesPage />} />
            <Route path="/cafe/:slug" element={<ProdutoPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/conta" element={<ContaPage />} />
            <Route path="/assinatura" element={<AssinaturaPage />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
