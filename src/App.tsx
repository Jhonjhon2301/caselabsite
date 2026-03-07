import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTrackingInit } from "@/hooks/useTracking";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";
import MyOrders from "./pages/MyOrders";
import Referral from "./pages/Referral";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import B2B from "./pages/B2B";
import SEOGarrafaAcademia from "./pages/SEOGarrafaAcademia";
import SEOBrindesCorporativos from "./pages/SEOBrindesCorporativos";
import SEOGarrafaTermica from "./pages/SEOGarrafaTermica";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminBanner from "./pages/admin/AdminBanner";
import AdminDesigner from "./pages/admin/AdminDesigner";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminStock from "./pages/admin/AdminStock";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReminders from "./pages/admin/AdminReminders";
import AdminNotes from "./pages/admin/AdminNotes";
import AdminFiscalNotes from "./pages/admin/AdminFiscalNotes";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminBI from "./pages/admin/AdminBI";
import AdminProduction from "./pages/admin/AdminProduction";
import AdminB2B from "./pages/admin/AdminB2B";
import AdminDRE from "./pages/admin/AdminDRE";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminDocs from "./pages/admin/AdminDocs";
import AdminInternalStock from "./pages/admin/AdminInternalStock";
import AdminProposals from "./pages/admin/AdminProposals";
import About from "./pages/About";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import LeadCapturePopup from "./components/LeadCapturePopup";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function TrackingInitializer() {
  useTrackingInit();
  return null;
}

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <TrackingInitializer />
          <Toaster />
          <Sonner />
          <LeadCapturePopup />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produto/:id" element={<ProductPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/meus-pedidos" element={<MyOrders />} />
              <Route path="/indicar" element={<Referral />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/b2b" element={<B2B />} />
              <Route path="/garrafa-personalizada-academia" element={<SEOGarrafaAcademia />} />
              <Route path="/brindes-corporativos-personalizados" element={<SEOBrindesCorporativos />} />
              <Route path="/garrafa-termica-com-logo" element={<SEOGarrafaTermica />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="financial" element={<AdminFinancial />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="team" element={<AdminTeam />} />
                <Route path="banner" element={<AdminBanner />} />
                <Route path="documents" element={<AdminDocuments />} />
                <Route path="stock" element={<AdminStock />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="reminders" element={<AdminReminders />} />
                <Route path="notes" element={<AdminNotes />} />
                <Route path="fiscal" element={<AdminFiscalNotes />} />
                <Route path="designer" element={<AdminDesigner />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="bi" element={<AdminBI />} />
                <Route path="production" element={<AdminProduction />} />
                <Route path="b2b" element={<AdminB2B />} />
                <Route path="dre" element={<AdminDRE />} />
                <Route path="audit" element={<AdminAuditLog />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
                <Route path="docs" element={<AdminDocs />} />
                <Route path="internal_stock" element={<AdminInternalStock />} />
                <Route path="proposals" element={<AdminProposals />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
