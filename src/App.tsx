import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";
import AdminLayout from "./pages/admin/AdminLayout";
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

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produto/:id" element={<ProductPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="/admin/products" replace />} />
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
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
