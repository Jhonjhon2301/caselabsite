import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { Package, ShoppingCart, Tag, Grid3X3, LogOut, Home, DollarSign, Users, ImageIcon } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function AdminLayout() {
  const { user, isAdmin, adminPosition, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const links = useMemo(() => {
    const all = [
      { to: "/admin/products", icon: Package, label: "Produtos", roles: ["ceo", "vendedor"] },
      { to: "/admin/orders", icon: ShoppingCart, label: "Pedidos", roles: ["ceo", "vendedor"] },
      { to: "/admin/financial", icon: DollarSign, label: "Financeiro", roles: ["ceo", "financeiro"] },
      { to: "/admin/coupons", icon: Tag, label: "Cupons", roles: ["ceo", "vendedor"] },
      { to: "/admin/categories", icon: Grid3X3, label: "Categorias", roles: ["ceo"] },
      { to: "/admin/banner", icon: ImageIcon, label: "Banner", roles: ["ceo"] },
      { to: "/admin/team", icon: Users, label: "Equipe", roles: ["ceo"] },
    ];

    const pos = adminPosition || "ceo";
    return all.filter((l) => l.roles.includes(pos));
  }, [adminPosition]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  }

  if (!isAdmin) return null;

  const positionLabel: Record<string, string> = {
    ceo: "CEO",
    vendedor: "Vendedor",
    financeiro: "Financeiro",
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <img src={logo} alt="Case Lab" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="font-heading font-bold text-sm">CASE LAB</p>
            <p className="text-xs text-muted-foreground">
              {positionLabel[adminPosition || "ceo"] || "Admin"}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
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
