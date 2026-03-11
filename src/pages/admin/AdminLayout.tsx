import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingCart, Tag, Grid3X3, LogOut, Home, DollarSign,
  Users, ImageIcon, FileText, Warehouse, CreditCard, Bell, StickyNote,
  Palette, Shield, Menu, X, Receipt, LayoutDashboard, Star, BookOpen,
  BarChart3, Factory, Building2, FileBarChart, ShieldAlert, Mail, FileCode, Megaphone,
  MessageSquare, Palette
} from "lucide-react";
import logo from "@/assets/logo.jpeg";

const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  products: Package,
  stock: Warehouse,
  internal_stock: Package,
  orders: ShoppingCart,
  financial: DollarSign,
  coupons: Tag,
  categories: Grid3X3,
  documents: FileText,
  banner: ImageIcon,
  payments: CreditCard,
  reminders: Bell,
  notes: StickyNote,
  team: Users,
  designer: Palette,
  roles: Shield,
  fiscal: Receipt,
  customers: Users,
  blog: BookOpen,
  reviews: Star,
  bi: BarChart3,
  production: Factory,
  b2b: Building2,
  dre: FileBarChart,
  audit: ShieldAlert,
  leads: Mail,
  newsletter: Megaphone,
  docs: FileCode,
  proposals: FileText,
  "shared-cart": ShoppingCart,
  chat: MessageSquare,
  "art-templates": Palette,
};

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Pedidos",
  production: "Produção",
  "shared-cart": "Montar Carrinho",
  products: "Produtos",
  categories: "Categorias",
  stock: "Estoque",
  internal_stock: "Estoque Interno",
  customers: "Clientes",
  leads: "Leads",
  b2b: "B2B",
  financial: "Financeiro",
  dre: "DRE",
  payments: "Pagamentos",
  coupons: "Cupons",
  proposals: "Propostas",
  blog: "Blog",
  reviews: "Avaliações",
  newsletter: "Newsletter",
  banner: "Banner",
  designer: "Designer Drive",
  fiscal: "Notas Fiscais",
  documents: "Documentos",
  team: "Equipe",
  roles: "Cargos",
  audit: "Auditoria",
  reminders: "Lembretes",
  notes: "Notas",
  bi: "BI Avançado",
  docs: "Documentação",
};

// Ordered keys for sidebar display
const ORDERED_KEYS = Object.keys(LABEL_MAP);

export default function AdminLayout() {
  const { user, isAdmin, adminPosition, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [positionLabel, setPositionLabel] = useState("Admin");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!adminPosition) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("custom_positions")
        .select("label, permissions")
        .eq("name", adminPosition)
        .maybeSingle();
      if (data) {
        setPermissions(data.permissions as string[]);
        setPositionLabel(data.label as string);
      } else {
        setPermissions(ORDERED_KEYS);
        setPositionLabel("CEO");
      }
    };
    fetch();
  }, [adminPosition]);

  const links = useMemo(() => {
    // Sort by ORDERED_KEYS order
    return ORDERED_KEYS
      .filter((p) => permissions.includes(p) && LABEL_MAP[p])
      .map((p) => ({
        to: `/admin/${p}`,
        icon: ICON_MAP[p] || Package,
        label: LABEL_MAP[p],
      }));
  }, [permissions]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  }

  if (!isAdmin) return null;

  const sidebarContent = (
    <>
      <div className="p-4 sm:p-6 border-b border-border flex items-center gap-3">
        <img src={logo} alt="Case Lab" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm">CASE LAB</p>
          <p className="text-xs text-muted-foreground truncate">{positionLabel}</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-0.5 sm:space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 sm:p-4 border-t border-border space-y-0.5 sm:space-y-1">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full">
          <Home className="w-4 h-4 shrink-0" /> Ir para a Loja
        </button>
        <button onClick={signOut} className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
          <LogOut className="w-4 h-4 shrink-0" /> Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-card border-b border-border flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src={logo} alt="Case Lab" className="h-8 w-8 rounded-full object-cover" />
        <p className="font-heading font-bold text-sm flex-1">Painel Admin</p>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop fixed, mobile slide-out */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[280px] bg-card border-r border-border flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:w-64 lg:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-[52px] lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
