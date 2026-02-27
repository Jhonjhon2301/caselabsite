import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingCart, Tag, Grid3X3, LogOut, Home, DollarSign,
  Users, ImageIcon, FileText, Warehouse, CreditCard, Bell, StickyNote,
  Palette, Shield
} from "lucide-react";
import logo from "@/assets/logo.jpeg";

const ICON_MAP: Record<string, React.ElementType> = {
  products: Package,
  stock: Warehouse,
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
};

const LABEL_MAP: Record<string, string> = {
  products: "Produtos",
  stock: "Estoque",
  orders: "Pedidos",
  financial: "Financeiro",
  coupons: "Cupons",
  categories: "Categorias",
  documents: "Documentos",
  banner: "Banner",
  payments: "Pagamentos",
  reminders: "Lembretes",
  notes: "Notas",
  team: "Equipe",
  designer: "Designer Drive",
  roles: "Cargos",
};

export default function AdminLayout() {
  const { user, isAdmin, adminPosition, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [positionLabel, setPositionLabel] = useState("Admin");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Fetch permissions from custom_positions table
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
        // Fallback: CEO gets everything
        setPermissions(Object.keys(LABEL_MAP));
        setPositionLabel("CEO");
      }
    };
    fetch();
  }, [adminPosition]);

  const links = useMemo(() => {
    return permissions
      .filter((p) => LABEL_MAP[p])
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

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <img src={logo} alt="Case Lab" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="font-heading font-bold text-sm">CASE LAB</p>
            <p className="text-xs text-muted-foreground">{positionLabel}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full">
            <Home className="w-4 h-4" /> Ir para a Loja
          </button>
          <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
